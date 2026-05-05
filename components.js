async function getTemplate(templateId) {
  try {
    const response = await fetch('./components.html');
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html', {
      includeShadowRoots: true 
    });
    
    const template = doc.querySelector('template#' + templateId);    
    return template ? template.content.cloneNode(true) : null;
    
  } catch(err) {
    console.error('Unable to fetch component: ' + err);
  }
}

class textEditor extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = [];

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._internals.role = 'application';
        
        const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });
        this.templateLoading = getTemplate('text-editor').then(templateFrag => {
          if (templateFrag) {
            shadow.appendChild(templateFrag);
          }
        });
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

    attributeChangedCallback(name, oldValue, newValue) {}

    async connectedCallback() {
      this.state = "loading";
      
      await this.templateLoading;
      
      const editor = this.shadowRoot;
      const styles = this.dataset.css;
      const host = this;
      
      const plainTextEditor = editor.querySelector('#plaintext');
      const richTextEditor = editor.querySelector('#richtext');

      if (!plainTextEditor || !richTextEditor) return;
      
      const richTextDoc = richTextEditor.contentWindow;
    
      const updateEditor = () => {
        if (this.state === 'plaintext') {
          richTextDoc.document.body.innerHTML = plainTextEditor.value;
        } else if (this.state === 'richtext') {
          plainTextEditor.value = richTextDoc.document.body.innerHTML;
        }
      };
  
      const initializeDesignMode = (event) => {
        const doc = event.target.contentDocument;
        doc.designMode = "on";
        
        setTimeout(() => {
          doc.body.innerHTML = plainTextEditor.value;
          this.state = "plaintext";
        }, 10);
      };
  
      const toggleInert = () => {
        plainTextEditor.inert = !plainTextEditor.inert;
        richTextEditor.inert = !richTextEditor.inert;
        
        const activeEditor = editor.querySelector("#editor > :not([inert])");
        if (activeEditor) {
          this.state = activeEditor.id;
        }
      };
        
      plainTextEditor.addEventListener('input', updateEditor);
      richTextEditor.addEventListener('load', initializeDesignMode);
        
      const toggleBtn = editor.querySelector('#toggle-view');
      if (toggleBtn) { toggleBtn.addEventListener('click', toggleInert); }
        
      window.addEventListener('message', (event) => {
        if (event.source !== richTextDoc) return;
        
        const temp = document.createElement('div');
        temp.innerHTML = event.data;
        plainTextEditor.value = temp.innerHTML;
      });


    const updateSlottedAttr = (slot) => {
      const hasContent = slot.assignedElements({ flatten: true }).length > 0;

      console.log(hasContent);
      
      if (hasContent) {
        slot.setAttribute('slotted', '');
      } else {
        slot.removeAttribute('slotted');
      }
    };
    editor.addEventListener('slotchange', updateSlottedAttr);
    updateSlottedAttr();
      
    } /* END CONNECTED CALLBACK */

}
customElements.define("text-editor", textEditor);



class menuItem extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ['slot'];
  
    constructor() {
      super();
      this._internals = this.attachInternals();
      this._internals.role = 'menuitem';
      
      const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });
      this.templateLoading = getTemplate('menu-item').then(templateFrag => {
        if (templateFrag) {
          shadow.appendChild(templateFrag);
        }
      });
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      this._internals.ariaLabel = newValue;
    }
  
    connectedCallBack() {}
}
customElements.define("menu-item", menuItem);
