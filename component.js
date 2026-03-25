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
          <button id="toggle-view" aria-label="Toggle Mode" part="btn-menu"></button>
          
          <button id="view-actions" aria-label="View Actions" part="btn-menu"></button>
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

        @property --command-icon {
            syntax: '<url>';
            inherits: false;
            initial-value: 
        }
        
        ::slotted(button[command])::after,
        button[part="btn-menu"]{
          content: '';
          mask-image: var(--command-icon);
          mask-position: center;
          mask-repeat: no-repeat;
          width: 85cqw;
          aspect-ratio: 1 / 1;
          background-color: currentColor;
        }
        
        ::slotted(button[command="--bold"])::after {
            content: '' / 'Bold Text';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 1920 1920"><path d="M480.286 822.857h548.571c151.269 0 274.286-123.017 274.286-274.286 0-151.268-123.017-274.285-274.286-274.285H480.286v548.571Zm0 822.857H1166c151.269 0 274.286-123.017 274.286-274.285 0-151.269-123.017-274.286-274.286-274.286H480.286v548.571ZM1166 1920H206V0h822.857c302.537 0 548.572 246.034 548.572 548.571 0 134.263-48.549 257.418-128.778 352.732 159.223 96.137 265.92 270.994 265.92 470.126 0 302.537-246.034 548.571-548.571 548.571Z" fill-rule="evenodd"/></svg>');
        }
        
        ::slotted(button[command="--strike"])::after {
            content: '' / 'Strike Text';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 1920 1920"><path d="M1471.2 1261.689c9.24 67.2 4.92 138.84-16.32 215.64-53.16 190.08-176.64 319.56-348 364.8-46.44 12.24-94.56 17.76-143.04 17.76-209.16 0-424.92-104.04-546.84-225.12l-52.44-56.04 175.68-163.68 49.2 52.92c98.76 97.92 303.48 182.16 456.24 142.08 89.28-23.64 147.48-87.96 177.96-196.92 16.56-60 17.16-109.44 3.12-151.44Zm-31.92-991.08-163.8 175.32c-105.12-98.16-319.2-176.16-469.8-134.76-85.8 23.28-141.6 82.08-170.64 179.76-54.48 183.24 66.72 252 377.76 345.48 71.04 21.36 133.56 40.68 183.96 65.28H1920v240H0v-240h561.72c-135.6-96.84-226.68-243.6-156.72-479.16 67.08-225.84 220.68-311.16 337.8-343.08 247.8-66.72 543.6 48.36 696.48 191.16Z" fill-rule="evenodd"/></svg>');
        }
        
        ::slotted(button[command="--underline"]) {
            content: '' / 'Underline Text';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 1920 1920"><path d="M1714.571 1645.714V1920H206v-274.286h1508.571ZM480.286 0v822.857c0 227.246 184.183 411.429 411.428 411.429h137.143c227.246 0 411.429-184.183 411.429-411.429V0h274.285v822.857c0 378.789-307.062 685.714-685.714 685.714H891.714C513.063 1508.571 206 1201.646 206 822.857V0h274.286Z" fill-rule="evenodd"/></svg>');
        }

        ::slotted(button[command="--quote"]) {
            content: '' / 'Create Quote';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 32 32" version="1.1"><title>quote</title><path d="M9.563 8.469l-0.813-1.25c-5.625 3.781-8.75 8.375-8.75 12.156 0 3.656 2.688 5.375 4.969 5.375 2.875 0 4.906-2.438 4.906-5 0-2.156-1.375-4-3.219-4.688-0.531-0.188-1.031-0.344-1.031-1.25 0-1.156 0.844-2.875 3.938-5.344zM21.969 8.469l-0.813-1.25c-5.563 3.781-8.75 8.375-8.75 12.156 0 3.656 2.75 5.375 5.031 5.375 2.906 0 4.969-2.438 4.969-5 0-2.156-1.406-4-3.313-4.688-0.531-0.188-1-0.344-1-1.25 0-1.156 0.875-2.875 3.875-5.344z"/></svg>')
        }

        ::slotted(button[command="--list-bullet"]) {
            content: '' / 'Create Bulleted List;
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 1920 1920"><path d="M225.882 1298.412c124.574 0 225.883 101.308 225.883 225.882s-101.309 225.882-225.883 225.882C101.308 1750.176 0 1648.868 0 1524.294s101.308-225.882 225.882-225.882ZM1920 1411.352v225.883H677.647v-225.882H1920ZM225.882 733.707c124.574 0 225.883 101.308 225.883 225.882s-101.309 225.883-225.883 225.883C101.308 1185.47 0 1084.162 0 959.588c0-124.574 101.308-225.882 225.882-225.882ZM1920 846.647v225.882H677.647V846.647H1920ZM225.882 169c124.574 0 225.883 101.308 225.883 225.882S350.456 620.765 225.882 620.765C101.308 620.765 0 519.456 0 394.882 0 270.308 101.308 169 225.882 169ZM1920 281.941v225.883H677.647V281.94H1920Z" fill-rule="evenodd"/></svg>');
        }
        
        ::slotted(button[command="--list-number"]) {
            content: '' / 'Create Numbered List';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 33.22 33.22" fill="%23030104" width="25px" height="25px"><rect x="8.136" y="5.506" height="5.1" width="25.084"/><rect x="8.136" y="13.722" width="25.084" height="5.098"/><rect x="8.136" y="22.506" width="25.084" height="5.098"/><polygon points="1.519,6.119 1.539,6.119 1.539,11.369 3.038,11.369 3.038,4.74 1.765,4.74 0,5.558 0.255,6.72 "/><path d="M4.61,18.328H2.15v-0.021l0.6-0.5c0.949-0.838,1.73-1.707,1.73-2.799c0-1.182-0.8-2.039-2.279-2.039 c-0.872,0-1.64,0.299-2.121,0.668l0.431,1.082c0.339-0.25,0.831-0.531,1.389-0.531c0.751,0,1.061,0.422,1.061,0.949 c-0.01,0.762-0.7,1.49-2.129,2.77L0,18.656v0.924h4.61V18.328z"/><path d="M3.305,24.842v-0.02c0.816-0.277,1.213-0.838,1.213-1.541c0-0.908-0.785-1.648-2.192-1.648 c-0.867,0-1.651,0.242-2.049,0.496l0.317,1.123c0.265-0.164,0.835-0.396,1.375-0.396c0.664,0,0.981,0.293,0.981,0.691 c0,0.562-0.654,0.764-1.174,0.764h-0.6v1.111h0.631c0.673,0,1.327,0.297,1.327,0.959c0,0.49-0.409,0.877-1.214,0.877 c-0.632,0-1.265-0.254-1.54-0.408l-0.317,1.174c0.389,0.232,1.113,0.457,1.969,0.457c1.682,0,2.713-0.855,2.713-2.016 C4.745,25.586,4.103,24.982,3.305,24.842z"/></svg>');
        }

        ::slotted(button[command="--link"]) {
            content: '' / 'Create Link';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 16 16" fill="none"><path d="M7.05025 1.53553C8.03344 0.552348 9.36692 0 10.7574 0C13.6528 0 16 2.34721 16 5.24264C16 6.63308 15.4477 7.96656 14.4645 8.94975L12.4142 11L11 9.58579L13.0503 7.53553C13.6584 6.92742 14 6.10264 14 5.24264C14 3.45178 12.5482 2 10.7574 2C9.89736 2 9.07258 2.34163 8.46447 2.94975L6.41421 5L5 3.58579L7.05025 1.53553Z" fill="%23000000"/><path d="M7.53553 13.0503L9.58579 11L11 12.4142L8.94975 14.4645C7.96656 15.4477 6.63308 16 5.24264 16C2.34721 16 0 13.6528 0 10.7574C0 9.36693 0.552347 8.03344 1.53553 7.05025L3.58579 5L5 6.41421L2.94975 8.46447C2.34163 9.07258 2 9.89736 2 10.7574C2 12.5482 3.45178 14 5.24264 14C6.10264 14 6.92742 13.6584 7.53553 13.0503Z" fill="%23000000"/><path d="M5.70711 11.7071L11.7071 5.70711L10.2929 4.29289L4.29289 10.2929L5.70711 11.7071Z" fill="%23000000"/></svg>');
        }

        ::slotted(button[command="--image"]) {
            content: '' / 'Add Image';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 24 24"><path d="M21,4H3A1,1,0,0,0,2,5V19a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V5A1,1,0,0,0,21,4ZM7,7A2,2,0,1,1,5,9,2,2,0,0,1,7,7ZM20,18H4V16.333L8,13l2.857,2.143L16,10l4,5.333Z"/></svg>');
        }

        ::slotted(button:not([command])) {
            display: none;
        }

        button#toggle-view::after {
            content: '' / 'Toggle View';
            --command-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 16 16" fill="none"><path d="M8.01005 0.858582L6.01005 14.8586L7.98995 15.1414L9.98995 1.14142L8.01005 0.858582Z" fill="%23000000"/><path d="M12.5 11.5L11.0858 10.0858L13.1716 8L11.0858 5.91422L12.5 4.5L16 8L12.5 11.5Z" fill="%23000000"/><path d="M2.82843 8L4.91421 10.0858L3.5 11.5L0 8L3.5 4.5L4.91421 5.91422L2.82843 8Z" fill="%23000000"/></svg>');
        }

        button#view-actions::after {
            content: '' / View Actions;
            mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23000000" width="25px" height="25px" viewBox="0 0 24 24"><circle cx="12" cy="17.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="6.5" r="1.5"/></svg>');
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
