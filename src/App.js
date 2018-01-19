import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
const electron = window.require('electron');
const fs = electron.remote.require('fs');
const ipcRenderer  = electron.ipcRenderer;

class App extends Component {

  componentDidMount() {
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
      console.log('Got message:', arg);
    });
  }

  onClickTest = () => {
    console.log('Send ping');
    ipcRenderer.send('asynchronous-message', 'ping');
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">React App</h1>
        </header>
        <p className="App-intro">
          <button onClick={this.onClickTest}>test</button>
        </p>
      </div>
    );
  }
}

export default App;
