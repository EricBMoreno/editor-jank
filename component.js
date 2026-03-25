class textEditor extends HTMLElement {
    static observedAttributes = [];

    constructor() {
      super();
      this._internals = this.attachInternals();
      this._internals.role = 'application';
    }
  
    get state() {
      return this._state;
    }
  
    set state(stateName) {      
      if (stateName === "loading") {
        this._state = "loading";
        this._internals.states.add("loading");
        this._internals.states.delete("plaintext");
        this._internals.states.delete("richtext");
      } else if(stateName === "plaintext") {
        this._state = "plaintext";
        this._internals.states.add("plaintext");
        this._internals.states.delete("loading");
        this._internals.states.delete("richtext");
      } else {
        this._state = "richtext";
        this._internals.states.add("richtext");
        this._internals.states.delete("plaintext");
        this._internals.states.delete("loading");
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    connectedCallback() {
        this.state = "loading";
        const shadowRoot = this.attachShadow({ mode: "open" });
        let editor = this.shadowRoot;
        let styles = this.dataset.css;
        editor.innerHTML = `
        <menu id="toolbar" role="toolbar" part="toolbar">
          <slot></slot>
          <button id="toggle-view" aria-label="Toggle Mode" part="btn-menu">
            <span aria-hidden="true">&lt;/&gt;</span>
          </button>
          
          <button id="view-actions" aria-label="View Actions" part="btn-menu">
            &vellip;
          </button>
        </menu>

        <section id="editor" aria-label="editable region">
            <textarea id="plaintext" class="edit-region" part="plaintext-editor"><p style="color: red; font-size: 1.5rem;"><strong>This pen is blue.</strong></p></textarea>
            <iframe id="richtext" class="edit-region" part="richtext-editor"
            srcdoc=""
            sandbox="allow-same-origin" inert loading="lazy"></iframe>
        </section>

        <footer id="counters" part="footer">
            <small id="mode"></small>
        </footer>
        `
        const host = this;
        const plainTextEditor = editor.querySelector('#plaintext');
        const richTextEditor = editor.querySelector('#richtext');
        const richTextDoc = richTextEditor.contentWindow;
        const parser = new DOMParser();
      
        function updateEditor(event) {          
            let message;
          
            if(host.state === 'plaintext') {
              message = plainTextEditor.value;
              richTextDoc.postMessage(message);
            } else if(host.state === 'richtext') {
              message = richTextDoc.document.body.innerHTML.toString();
              plainTextEditor.value = message;
            }
        };
      
        function initializeDesignMode(event) {
          event.target.contentDocument.designMode = "on";
          richTextDoc.postMessage(plainTextEditor.value);
          updateEditor(event);
          host.state = "plaintext";
        };

        function toggleInert(event) {
            plainTextEditor.inert = !plainTextEditor.inert;
            richTextEditor.inert = !richTextEditor.inert;
            let activeEditor = editor.querySelector("#editor :not([inert])").id;
            host.state = activeEditor;
        }

        plainTextEditor.addEventListener('input', updateEditor);
        richTextDoc.addEventListener('input', updateEditor);
        richTextEditor.addEventListener('load', initializeDesignMode);
        editor.querySelector('#toggle-view').addEventListener('click', toggleInert);
      
        richTextDoc.addEventListener('message', event => {
          let temp = document.createElement('template');
          temp.innerHTML = '<div id="content">' + event.data + '</div>';
          let newContent = temp.content.querySelector('#content').innerHTML;
          event.target.document.body.innerHTML = newContent;
        });
      

        const style = document.createElement('style');
        style.textContent = `

        @property --primary-color {
            syntax: '<color>';
            inherits: true;
            initial-value: CanvasText;
        }

        @property --secondary-color-color {
            syntax: '<color>';
            inherits: true;
            initial-value: Canvas;
        }

        :host {
            --primary-color: currentColor;
            --secondary-color: oklch(from currentColor calc(l + .15) c h);
            --primary-inverted: rgb(from var(--primary-color) calc(255 - r) calc(255 - g) calc(255 - b));

            --footer-height: 30px;

            display: block;
            background-color: var(--secondary-color);
            border: solid 2px;

            min-height: min-content;
            height:-webkit-fill-available;
            height: -moz-available;
            height: stretch;
            resize: vertical;
            overflow: auto;
            position: relative;
        }

        #toolbar {
            display: flex;
            flex-wrap: wrap;
            list-style: none;
            margin: 0;
            padding: 0;      
            height: min-content !important;      
            z-index: 2;
            font-family: system-ui;
        }
        
        .sr-only {          
            clip: rect(0 0 0 0); 
            clip-path: inset(50%);
            height: 1px;
            overflow: hidden;
            position: absolute;
            white-space: nowrap; 
            width: 1px;
        }

        button, ::slotted(button), label
        {
            color: oklch(from var(--secondary-color) calc(l - .65) c h);
            background-color: oklch(from var(--secondary-color) calc(l + .65) c h);

            mix-blend-mode: hard-light;
            height: 50px;
            aspect-ratio: 1 / 1;
            border: 0;
            margin: 0;
            padding: 0;
            
            display: grid;
            place-content: center;
            
            position: relative;
            overflow: clip;

            flex: 0 0;
            z-index: 2;
        }
        
        button:hover, ::slotted(button:hover),
        label:has(input:checked), label:is(:hover, :focus)
        {
            filter: invert(100%);
        }

        button:active, ::slotted(button:active),
        label:has(input):active
        { 
            filter: invert(0%); 
        }

        ::slotted(button) {
            container: btn / inline-size;
        }

        
        
        ::slotted(button[command])::after {
          content: '';
          mask-image: var(--command-icon);
          mask-repeat: no-repeat;
          width: 85cqw;
          aspect-ratio: 1 / 1;
          background-color: currentColor;
        }
        
        ::slotted(button[command="--bold"]) {
          --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="800px" height="800px" viewBox="0 0 1920 1920"><path d="M480.286 822.857h548.571c151.269 0 274.286-123.017 274.286-274.286 0-151.268-123.017-274.285-274.286-274.285H480.286v548.571Zm0 822.857H1166c151.269 0 274.286-123.017 274.286-274.285 0-151.269-123.017-274.286-274.286-274.286H480.286v548.571ZM1166 1920H206V0h822.857c302.537 0 548.572 246.034 548.572 548.571 0 134.263-48.549 257.418-128.778 352.732 159.223 96.137 265.92 270.994 265.92 470.126 0 302.537-246.034 548.571-548.571 548.571Z" fill-rule="evenodd"/></svg>');
        }
        
        ::slotted(button[command="--strike"]) {
          --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="800px" height="800px" viewBox="0 0 1920 1920"><path d="M1471.2 1261.689c9.24 67.2 4.92 138.84-16.32 215.64-53.16 190.08-176.64 319.56-348 364.8-46.44 12.24-94.56 17.76-143.04 17.76-209.16 0-424.92-104.04-546.84-225.12l-52.44-56.04 175.68-163.68 49.2 52.92c98.76 97.92 303.48 182.16 456.24 142.08 89.28-23.64 147.48-87.96 177.96-196.92 16.56-60 17.16-109.44 3.12-151.44Zm-31.92-991.08-163.8 175.32c-105.12-98.16-319.2-176.16-469.8-134.76-85.8 23.28-141.6 82.08-170.64 179.76-54.48 183.24 66.72 252 377.76 345.48 71.04 21.36 133.56 40.68 183.96 65.28H1920v240H0v-240h561.72c-135.6-96.84-226.68-243.6-156.72-479.16 67.08-225.84 220.68-311.16 337.8-343.08 247.8-66.72 543.6 48.36 696.48 191.16Z" fill-rule="evenodd"/></svg>');
        }
        
        ::slotted(button[command="--underline"]) {
          --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="800px" height="800px" viewBox="0 0 1920 1920"><path d="M1714.571 1645.714V1920H206v-274.286h1508.571ZM480.286 0v822.857c0 227.246 184.183 411.429 411.428 411.429h137.143c227.246 0 411.429-184.183 411.429-411.429V0h274.285v822.857c0 378.789-307.062 685.714-685.714 685.714H891.714C513.063 1508.571 206 1201.646 206 822.857V0h274.286Z" fill-rule="evenodd"/></svg>');
        }

        
        hr {
            background-color: transparent;
            width: 5px;
            margin: 0;
            border: 0;
        }

        ::slotted(select) {
            padding-left: 1rem;
            min-width: 100px;
            max-width: 250px;
            height: 50px;
            border: 0;
            flex: 2;
            position: relative;        
        }

        div:has(slot), #base {
            display: flex;
            gap: .125rem;
        }

        #plaintext, #richtext {
            color: inherit;
            display: block;
            width: -webkit-fill-available;
            width: -moz-available;
            min-height: 200px;
            height: calc(100% - var(--footer-height));
            background: white;
            padding: 1rem;
            border-style: solid;
            border-width: 5px 0 2.5px 0;
            border-color: oklch(from var(--secondary-color) calc(l - .1) c h);
            outline: 0;
            resize: none;
            z-index: 1;
            
            &[inert] {
                display: none;
            }
        }

        footer {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0 0.5rem;
            height: var(--footer-height);
            font-family: sans-serif;
            pointer-events: none;
            user-select: none;
        }
        
        
        footer small {        
            color: var(--primary-inverted);
            filter: grayscale(1) contrast(8000%);
        }
        
        :host(:state(plaintext)) #mode::after {
          content: 'Mode: Plain text' / 'Plain Text Mode';
        }
        
        :host(:state(richtext)) #mode::after {
          content: 'Mode: Rich text' / 'Rich Text Mode';
        }

        .icon {
            width: 25px;
            scale: 0.65;
            aspect-ratio: 1 / 1;
            pointer-events: none;
        }

        // svg:has(mask) {
        //     width: 1px;
        //     height: 1px;
        //     position: absolute;
        //     opacity: 0;
        //     pointer-events: none;
        // }

        @media (width < 782px) {
            #toolbar #view-actions { 
                // background: blue !important; 
            }
            slot, hr { 
                display: none; 
            }

            div:has(slot) {
                gap: 0.125
            }
        }
    `
        
    shadowRoot.appendChild(style);
      
    }

}
customElements.define("text-editor", textEditor);
