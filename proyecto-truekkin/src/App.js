import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div class="container">
        <h1 class="logo">TRUEKKI</h1>
        <h2 class="tagline">Intercambios seguros y rápidos</h2>
        
        <div class="buttons">
            <button class="btn btn-login" id="loginBtn">INICIAR SESIÓN</button>
            <button class="btn btn-register" id="loginBtn">REGISTRARSE</button>
        </div>
        
    </div>
      </header>
    </div>
  );
}

export default App;
