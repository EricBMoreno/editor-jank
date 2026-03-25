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

        
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
            <mask id="mask-strike">
                <path d="M5 4.75C5 4.45531 5.16258 4.05336 5.69626 3.66792C6.22795 3.28392 7.03762 3 8 3C9.75028 3 10.7599 3.87319 10.9539 4.4663L13.8053 3.5337C13.0616 1.26011 10.5055 0 8 0C6.4771 0 5.03677 0.443615 3.93978 1.23588C2.84478 2.02672 2 3.24977 2 4.75C2 5.59786 2.26982 6.35719 2.70214 7H0V9H16V7H10.7035C9.87766 6.67447 8.95507 6.5 8 6.5C7.03762 6.5 6.22795 6.21608 5.69626 5.83208C5.16258 5.44664 5 5.04469 5 4.75Z" fill="#000000"/>
                <path d="M11 11.25C11 11.1732 10.989 11.0892 10.9632 11H13.9921C13.9973 11.0824 14 11.1658 14 11.25C14 12.7502 13.1552 13.9733 12.0602 14.7641C10.9632 15.5564 9.5229 16 8 16C5.49455 16 2.93836 14.7399 2.19473 12.4663L5.0461 11.5337C5.24008 12.1268 6.24972 13 8 13C8.96238 13 9.77205 12.7161 10.3037 12.3321C10.8374 11.9466 11 11.5447 11 11.25Z" fill="#000000"/>
            </mask>
            <mask id="mask-underline">
                <path d="M3 1V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V1H10V7C10 8.10457 9.10457 9 8 9C6.89543 9 6 8.10457 6 7V1H3Z" fill="#000000"/>
                <path d="M14 16V14H2V16H14Z" fill="#000000"/>
            </mask>
            <mask id="mask-bold">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M2 1H8.625C11.0412 1 13 2.95875 13 5.375C13 6.08661 12.8301 6.75853 12.5287 7.35243C13.4313 8.15386 14 9.32301 14 10.625C14 13.0412 12.0412 15 9.625 15H2V1ZM5.5 9.75V11.5H9.625C10.1082 11.5 10.5 11.1082 10.5 10.625C10.5 10.1418 10.1082 9.75 9.625 9.75H5.5ZM5.5 6.25H8.625C9.10825 6.25 9.5 5.85825 9.5 5.375C9.5 4.89175 9.10825 4.5 8.625 4.5H5.5V6.25Z" fill="#000000"/>
            </mask>
        </svg>
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

            --footer-height: 10px;

            display: block;
            background-color: var(--secondary-color);
            border: solid 2px;

            min-height: min-content;
            // height: 500px;
            resize: vertical;
            overflow: auto;
            position: relative;
        }

        // #editor {
        //     height: -webkit-fill-available;
        //     height: -moz-available;
        //     height: stretch;
        // }

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
            text-color: blue;
            background-color: oklch(from var(--secondary-color) calc(l + .65) c h);

            mix-blend-mode: hard-light;
            height: 50px !important;
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

        
        
        ::slotted(button[command])::after {
          content: '';
          mask-image: var(--command-icon);
          mask-repeat: no-repeat;
          width: -webkit-fill-available;
          min-width: 12px;
          aspect-ratio: 1 / 1;
          background-color: currentColor;
          outline: solid red 1px;
        }
        
        ::slotted(button[command="--bold"]) {
          --command-icon: url(#mask-bold);
        }
        
        ::slotted(button[command="--strike"]) {
          --command-icon: url(#mask-strike);
        }
        
        ::slotted(button[command="--underline"]) {
          --command-icon: url(#mask-underline);
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

        svg:has(mask) {
            width: 1px;
            height: 1px;
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

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
