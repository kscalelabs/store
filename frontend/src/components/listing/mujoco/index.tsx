import React, { useEffect, useRef } from "react";

const MUJOCO = ({ url }: { url: string }) => {
  const appBodyRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const setupComponent = async () => {
      if (appBodyRef.current) {
        // Step 1: Set initial HTML content with styled container
        const htmlContent = `
          <div id="appbody" style="
              position: relative;
              width: 80vw;
              height: 100vh;
              overflow: hidden;
            " 
            data-urdf-url="${url}"
          >

            <div id="mujoco-ui-container" style="
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 10;
            "></div>
          </div>
        `;
        appBodyRef.current.innerHTML = htmlContent;
        scriptRef.current = document.createElement("script");
        scriptRef.current.type = "module";
        scriptRef.current.src = "/examples/main.js";
        appBodyRef.current
          ?.querySelector("#appbody")
          ?.appendChild(scriptRef.current);
      }
    };

    setupComponent();

    // Cleanup function
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      if (appBodyRef.current) {
        appBodyRef.current.innerHTML = "";
      }
      // Add any additional cleanup here, e.g., stopping WebAssembly instances
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        margin: "0",
        backgroundColor: "rgb(255, 255, 255)",
      }}
    >
      <div ref={appBodyRef}></div>
    </div>
  );
};

export default MUJOCO;
