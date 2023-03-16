import { useCallback, useEffect, useState } from "react";
import logo from "./logo.png";
import "./App.css";

const origin = window.location.origin;
const targetOrigin = "http://localhost:5173";
const controllerUrl = `${targetOrigin}/controller?origin=${origin}`;
const cardHolderNameUrl = `${targetOrigin}/name?origin=${origin}`;
const cardNumberUrl = `${targetOrigin}/number?origin=${origin}`;
const expiryUrl = `${targetOrigin}/expiry?origin=${origin}`;
const cvvUrl = `${targetOrigin}/cvv?origin=${origin}`;
const CARD_CONFIG = {
  networkCode: "VISA",
  inputs: [
    {
      key: "number",
      title: "Card Number",
      fieldName: "number",
      iframeUrl: cardNumberUrl,
    },
    {
      key: "expiry",
      title: "Expiry",
      fieldName: "expiry",
      iframeUrl: expiryUrl,
    },
    {
      key: "cvv",
      title: "Security Code (cvv)",
      fieldName: "cvv",
      iframeUrl: cvvUrl,
    },
    {
      key: "name",
      title: "Card Holder Name",
      fieldName: "name",
      iframeUrl: cardHolderNameUrl,
    },
  ],
};

function Field({ fieldName, iframeUrl, title, focused, valid, loading }) {
  const message = "Invalid " + title;
  const [src, setSrc] = useState(null);

  const [disabledField, setDisabledField] = useState(true);

  useEffect(() => {
    fetch(iframeUrl)
      .then((res) => {
        if (res.status === 404) {
          setDisabledField(true);
        } else setSrc(iframeUrl);
      })
      .catch((err) => {
        console.error("Unable to load iframe :: ", err);
        setDisabledField(true);
      });
  }, [iframeUrl]);

  function onFrameLoad(e) {
    setDisabledField(false);
  }

  function onError() {
    setDisabledField(true);
  }

  return (
    <div className="row">
      <div className="label">{title}:</div>
      <div
        className="field"
        disabled={disabledField || loading}
        focused={(!disabledField && !loading && focused) + ""}
        valid={valid + ""}
      >
        {src && (
          <iframe
            src={src}
            frameBorder="0"
            className="field-iframe"
            title={fieldName}
            id={fieldName}
            onLoad={onFrameLoad}
            onError={onError}
            style={{ display: loading || disabledField ? "none" : "block" }}
          />
        )}
      </div>
      <div className="message">
        {!disabledField && !loading && valid === false && message}
      </div>
    </div>
  );
}

function App() {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState("");
  const [focus, setFocus] = useState({
    number: false,
    expiry: false,
    cvv: false,
    name: false,
  });
  const [valid, setValid] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [readyToPay, setReadyToPay] = useState(false);

  useEffect(() => {
    setReadyToPay(valid.number && valid.expiry && valid.cvv && valid.name);
  }, [valid]);

  const listener = useCallback(
    (event) => {
      console.log("P<=>Event occurred :: ", event);
      console.log("P<=> event.origin :: ", event.origin);
      console.log("P<=> targetOrigin :: ", targetOrigin);
      console.log("P<=> event.origin !== targetOrigin :: ", event.origin !== targetOrigin);
      if (event.origin !== targetOrigin) return;

      console.log("P<=>Event occurred after ");

      const body = event.data;
      switch (body.type) {
        case "VALIDATION_INFO":
          setStatus({});
          setValid({
            ...valid,
            [body.sender]: Boolean(body.message),
          });
          break;

        case "FOCUS_INFO":
          setFocus({
            number: false,
            expiry: false,
            cvv: false,
            name: false,
            [body.sender]: true,
          });
          break;

        case "BLUR_INFO":
          setFocus({
            number: false,
            expiry: false,
            cvv: false,
            name: false,
          });
          break;

        case "NETWORK_INFO":
          setNetwork(body.message);
          break;

        case "PAYMENT_RESPONSE":
          completePayment(Boolean(body.message));
          break;

        default:
          break;
      }
    },
    [valid]
  );

  useEffect(() => {
    console.log("P<=> ADDING EVENT");
    window.addEventListener("message", listener);
    console.log("P<=> ADDED EVENT ");

    return () => {
      console.log("P<=> REMOVING E ");
      window.removeEventListener("message", listener);
    };
  }, [listener]);

  useEffect(() => {
    // Internal channel that iframes use to communicate
    const iframeChannel = new BroadcastChannel("MY_PRIVATE_CHANNEL");
    iframeChannel.onmessage = (event) => {
      console.log("Parent <== Received message from iframe channel ", event);
    };
  }, []);

  function initPayment() {
    setLoading(true);
    setStatus({
      message: "Payment in progress",
      type: "processing",
    });
    const iframe = document.getElementById("controller");
    const frameWindow = iframe.contentWindow || iframe.contentDocument;
    frameWindow.postMessage(
      {
        sender: "card-components",
        type: "PAYMENT_REQUEST",
        message: {
          abc: 123,
          key2: "value2",
        },
      },
      targetOrigin
    );
  }

  function completePayment(message) {
    console.log('completePayment :: ', message);
    if (message) {
      setValid({
        number: "",
        expiry: "",
        cvv: "",
        name: "",
      });
      setStatus({
        message: "Payment Successful",
        type: "success",
      });
    } else {
      setStatus({
        message: "Payment Failed",
        type: "error",
      });
    }
    setFocus({
      number: false,
      expiry: false,
      cvv: false,
      name: false,
    });
    setLoading(false);
  }

  return (
    <div className="app">
      <h1>Network: {network}</h1>
      <div className="card">
        {status.message && (
          <div className="card-head" type={status.type}>
            {status.message}
          </div>
        )}
        <div className="card-body">
          <iframe
            src={controllerUrl}
            frameBorder="0"
            className="field-iframe"
            title="controller"
            id="controller"
            style={{ display: "none" }}
          />
          {CARD_CONFIG.inputs.map((fieldConfig, index) => (
            <Field
              key={index}
              loading={loading}
              title={fieldConfig.title}
              valid={valid[fieldConfig.key]}
              focused={focus[fieldConfig.key]}
              fieldName={fieldConfig.fieldName}
              iframeUrl={fieldConfig.iframeUrl}
            />
          ))}

          <button
            className="submit-btn"
            disabled={!readyToPay || loading}
            onClick={initPayment}
          >
            <img src={logo} className="app-logo" alt="logo" />
            {!loading && <span className="btn-txt">Pay</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
