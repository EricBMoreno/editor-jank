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

            --footer-height: 10px;

            display: block;
            background-color: var(--secondary-color);
            border: solid 2px;

            min-height: min-content;
            height: 500px;
            resize: horizontal;
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

            padding: 0.75rem 1rem;
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
          content: 'Mode: Plain text';
        }
        
        :host(:state(richtext)) #mode::after {
          content: 'Mode: Rich text';
        }

        .icon {
            width: 25px;
            scale: 0.65;
            aspect-ratio: 1 / 1;
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
