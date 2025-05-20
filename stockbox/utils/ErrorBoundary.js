// Crea un componente ErrorBoundary.js
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Error Boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <Text>Algo salió mal. Por favor reinicia la aplicación.</Text>;
    }
    return this.props.children;
  }
}
