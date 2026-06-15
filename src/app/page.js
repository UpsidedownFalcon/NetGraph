export default function Home(){
  return(
    <main style={styles.wrap}>
      <span style={styles.dot} />
      <h1 style={styles.title}>NetGraph</h1> 
      <p style={styles.subtitle}>A private and visual map of the people you meet.</p> 
    </main>
  ); 
}

const styles = {
  wrap: {
    height: "100%", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12, 
  }, 
  dot: {
    width: 14, 
    height: 14, 
    borderRadius: "50%", 
    background: "var(--status-known)", 
    boxShadow: "0 0 16px var(--glow-known)", 
  }, 
  title: {fontSize: 24, fontWeight: 600, margin: 0 }, 
  subtitle: {color: "var(--text-secondary)", margin: 0 }, 
}; 
