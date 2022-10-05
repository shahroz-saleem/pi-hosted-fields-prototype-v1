import logo from "./logo.png";
import "./App.css";
import { useEffect, useRef } from "react";

function Row({ fieldName, iframeUrl, title, message }) {
  const frame = useRef();

  // 3: MESSAGE CHANNEL
  // https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API#examples
  // const channel = new MessageChannel();
  // const parentChannelInstance = channel.port1;

  useEffect(() => {
    // 1: POST MESSAGE
    // window.onmessage = function (event) {
    //   console.log("Inside Consumer ==> ", event);
    // };

    // 3: MESSAGE CHANNEL
    // parentChannelInstance.onmessage = function (event) {
    //   console.log("Inside parentChannelInstance message ==> ", event);
    // }

  }, [/*parentChannelInstance*/]);

  function sendMessage() {
    // 1: POST MESSAGE
    // frame.current.contentWindow.postMessage(
    //   "This is a message from consumer",
    //   "http://127.0.0.1:5500"
    // );

    // 3: MESSAGE CHANNEL
    // parentChannelInstance.postMessage("Message from parent (consumer)");
  }

  function onFrameLoad(e) {
    // 3: MESSAGE CHANNEL
    // e.target.contentWindow.postMessage('init', "http://127.0.0.1:5500", [channel.port2]);
  }

  return (
    <div className="row">
      <div className="label">{title}:</div>
      <div className="field">
        <iframe
          ref={frame}
          src={iframeUrl}
          frameBorder="0"
          className="field-iframe"
          title={fieldName}
          id={fieldName}
          onLoad={onFrameLoad}
        />
      </div>
      <div className="message">{message}</div>
      <button className="submit-btn" onClick={sendMessage}>
        send message
      </button>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <div className="card">
        <Row
          fieldName="cardNumber"
          title="Card Number"
          message="Here is some info about this field"
          // iframeUrl="https://stvnganga.github.io/card-number"
          iframeUrl="http://127.0.0.1:5500/iframe-callback.html"
        ></Row>
        <Row
        fieldName="expiry"
          title="Expiry"
          // iframeUrl="https://stvnganga.github.io/expiry"
          iframeUrl="http://127.0.0.1:5500/iframe-callback-copy.html"
        ></Row>
        <Row
          title="Security Code (cvv)"
          message="Here is some info about this field. Its a long string that takes two lines"
          iframeUrl="https://stvnganga.github.io/cvv"
        ></Row>
        <button className="submit-btn">
          <img src={logo} className="app-logo" alt="logo" />
          <span className="btn-txt">Pay</span>
        </button>
      </div>
    </div>
  );
}

export default App;

