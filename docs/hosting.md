# Self-Hosting NetGraph 

This is to access NetGraph @ `https://netgraph.yourdomain.com` (or some other domain) from any device, locked behind NetGraph's own login. 

```
Browser -- HTTPS --> Cloudflare -- tunnel --> cloudflared (on VM) ---> NetGraph on localhost:3000
```

---

## What's needed 

- A VM running the latest Ubuntu LTS (Ubuntu 26.04 "Resolute Raccoon" as of April 2026)
- A domain name 
- A free Cloudflare account 

---

## 1) Domain on Cloudflare 

The domain's DNS needs to be managed by Cloudlare: 

1. In [Cloudflare dashboard](https://dash.cloudflare.com) ---> **Add a
2. Cloudflare gives **two nameservers** (e.g `dana.ns.cloudflare.com`) ---> add to domain registrar 
4. Wait. 

---

## 2) Prepare Ubuntu VM 

Update: 

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

Enable firewall + allow SSH: 

```bash
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw enable
```

No need to expose port 80 / 443 / 3000 

---

## 3) Install Node and NetGraph 

NetGraph runs on Node @ [nodejs.org](https://nodejs.org) - latest LTS 24.x as of June 2026 

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Build tools for `better-sqlite3`: 

```bash
sudo apt-get install -y git build-essential python3
```

NetGraph code: 

```bash
cd ~
git clone https://github.com/UpsidedownFalcon/NetGraph.git
cd NetGraph
npm install
npm run build
```

`npm run build` is the production build. 

> If it finishes without errors, the app is ready to run 

---

## 4) Login and Secrets 

Same `.env.local` setup from [README](https://github.com/UpsidedownFalcon/NetGraph/blob/main/README.md): 

```bash
cp .env.example .env.local
```

Generate password hash (keep the quotes):

```bash
npm run hash-password "set-password"
```

That prints an `APP_PASSWORD_HASH_B64=...` line. Then generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open the env file (`nano .env.local`) and fill in three things: 
- `APP_USERNAME`
- `APP_PASSWORD_HASH_B64`
- `SESSION_SECRET` 

Save and close.


> Never commit this file (.env.local). It's gitignored for a reason — it's literally the only set of credentials.

---

## 5) systemd 

With `npm start` in the SSH session, the app would die upon logout, so using systemd. 

First find the full path to npm, because systemd needs absolute paths:

```bash
which npm
```

That's usually `/usr/bin/npm`. Now create the service file:

```bash
sudo nano /etc/systemd/system/netgraph.service
```

Paste this in, replacing `YOUR_USER` with Linux username (run `whoami` if unsure) and fixing differing paths: 

```ini
[Unit]
Description=NetGraph
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/home/YOUR_USER/NetGraph
ExecStart=/usr/bin/npm run start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

`WorkingDirectory` matters - Next.js reads `.env.local` from there, so it has to point at the app folder 

Turn it on: 

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now netgraph
sudo systemctl status netgraph
```

> Status should show "active (running)" 

Check with: 

```bash
curl -I http://localhost:3000
```

for a response with a redirect to `/login` is expected and correct - if not, use `journalctl -u netgraph -e` to show logs 

---

## 6) Cloudflare Tunnel

Install Cloudflare's `cloudflared`: 

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
```

Connect to Cloudflare account:

```bash
cloudflared tunnel login
```

Open printed URL in browser + login + pick domain set in Part 1 = server authorised + cert in `~/.cloudflared/` 

Create the tunnel `netgraph`:

```bash
cloudflared tunnel create netgraph
```

Note down
- **tunnel UUID** 
- path to a credentials JSON file e.g `/home/YOUR_USER/.cloudflared/<UUID>.json` 

Config tunnel: 

```bash
nano ~/.cloudflared/config.yml
```

Config file for tunnel (replace `<YOUR-TUNNEL-UUID>` and `netgraph.yourdomain.com`): 

```yaml
tunnel: <YOUR-TUNNEL-UUID>
credentials-file: /home/YOUR_USER/.cloudflared/<YOUR-TUNNEL-UUID>.json

ingress:
  - hostname: netgraph.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Point hostname to tunnel - DNS record automatically created in Cloudflare: 

```bash
cloudflared tunnel route dns netgraph netgraph.yourdomain.com
```

Test: 

```bash
cloudflared tunnel run netgraph
```

Load `https://netgraph.yourdomain.com` from a browser - NetGraph login screen should be served over HTTPS 

IF SUCCESSFUL, stop with `Ctrl+C` + make it into a service: 

```bash
sudo cloudflared --config /home/YOUR_USER/.cloudflared/config.yml service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

Now two services now run on boot: `netgraph` (the app) and `cloudflared` (the tunnel).

---

## 7) Final check

Reboot the box: 

```bash
sudo reboot
```

Load `https://netgraph.yourdomain.com` from a browser **not on the same network as the VM** - NetGraph login screen should be served over HTTPS 

---

## Maintenance 

### Updating to a new version: 

```bash
cd ~/NetGraph
git pull
npm install
npm run build
sudo systemctl restart netgraph
```

### Backing up data:  

Everything lives in one SQLite file - copy it somewhere safe on a schedule:

```bash
cp ~/NetGraph/data/data.db ~/netgraph-backup-$(date +%F).db
```

To restore, stop the app, drop the file back in, start it again:

```bash
sudo systemctl stop netgraph
cp ~/netgraph-backup-2026-01-01.db ~/NetGraph/data/data.db
sudo systemctl start netgraph
```

## Watching logs 

```bash
journalctl -u netgraph -e        # the app
journalctl -u cloudflared -e     # the tunnel
```

---
