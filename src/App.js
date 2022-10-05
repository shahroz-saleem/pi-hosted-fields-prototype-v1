import { useCallback, useEffect, useState } from "react";
import logo from "./logo.png";
import "./App.css";

const targetOrigin = "https://stvnganga.github.io";

function Row({ fieldName, iframeUrl, title, focused, valid, loading }) {
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
  const origin = window.location.origin;
  const cardNumberUrl = `${targetOrigin}/card?origin=${origin}`;
  const expiryUrl = `${targetOrigin}/expiry?origin=${origin}`;
  const cvvUrl = `${targetOrigin}/cvv?origin=${origin}`;

  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState({
    card: false,
    expiry: false,
    cvv: false,
  });
  const [valid, setValid] = useState({
    card: "",
    expiry: "",
    cvv: "",
  });

  const [readyToPay, setReadyToPay] = useState(false);
  useEffect(() => {
    setReadyToPay(valid.card && valid.expiry && valid.cvv);
  }, [valid]);

  const listener = useCallback(
    (event) => {
      if (event.origin !== targetOrigin) return;

      const body = event.data;
      switch (body.messageType) {
        case "validation":
          setStatus({});
          setValid({
            ...valid,
            [body.from]: body.data.valid,
          });
          break;

        case "event":
          switch (body.data.eventName) {
            case "onfocus":
              setFocus({
                card: false,
                expiry: false,
                cvv: false,
                [body.from]: true,
              });
              break;

            case "onblur":
              setFocus({
                card: false,
                expiry: false,
                cvv: false,
              });
              break;

            default:
              break;
          }
          break;

        case "payment-status":
          completePayment(body.data);
          break;

        default:
          break;
      }
    },
    [valid]
  );

  useEffect(() => {
    window.addEventListener("message", listener);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, [listener]);

  useEffect(() => {
    // Internal channel that iframes use to communicate
    const iframeChannel = new BroadcastChannel("payment");
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
    const iframe = document.getElementById("cardNumber");
    const frameWindow = iframe.contentWindow || iframe.contentDocument;
    frameWindow.postMessage(
      {
        from: "web-sdk",
        messageType: "start-payment",
        data: {
          abc: 123,
          key2: "value2",
        },
      },
      targetOrigin
    );
  }

  function completePayment(data) {
    if (data.statusCode < 300) {
      setValid({
        card: "",
        expiry: "",
        cvv: "",
      });
    }
    setFocus({
      card: false,
      expiry: false,
      cvv: false,
    });

    setStatus({
      message: data.message,
      type: data.statusCode >= 300 ? "error" : "success",
    });
    setLoading(false);
  }

  return (
    <div className="app">
      <div className="card">
        {status.message && (
          <div className="card-head" type={status.type}>
            {status.message}
          </div>
        )}
        <div className="card-body">
          <Row
            loading={loading}
            focused={focus.card}
            valid={valid.card}
            fieldName="cardNumber"
            title="Card Number"
            message="Here is some info about this field"
            iframeUrl={cardNumberUrl}
          ></Row>
          <Row
            loading={loading}
            focused={focus.expiry}
            valid={valid.expiry}
            fieldName="expiry"
            title="Expiry"
            iframeUrl={expiryUrl}
          ></Row>
          <Row
            loading={loading}
            focused={focus.cvv}
            valid={valid.cvv}
            fieldName="cvv"
            title="Security Code (cvv)"
            message="Here is some info about this field."
            iframeUrl={cvvUrl}
          ></Row>
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

