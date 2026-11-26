

export const tagRenderer = {
    

    elms: document.querySelectorAll('.render-tag'),

    render: () => {
        const self = tagRenderer;
        
        self.elms.forEach((e) => {
            const tagElms = self.createTagElms();
            const wrapper = tagElms.wrapper;
            const start = tagElms.start;
            const end = tagElms.end;

            e.before(wrapper);
            wrapper.appendChild(e);
            e.before(start);
            e.after(end);
            
            const tagName = e.tagName.toLowerCase();

            const startTagSpan = document.createElement('span');
            startTagSpan.classList.add('tag');
            startTagSpan.innerText = tagName;
            start.appendChild(startTagSpan);

            const endTagSpan = document.createElement('span');
            endTagSpan.classList.add('tag');
            endTagSpan.innerText = tagName;
            end.appendChild(endTagSpan);
            

            const attributes = e.attributes;
            const attribLength = attributes.length;

            //per attribute
            for(const {name, value} of attributes){
                
                const startNameSpan = document.createElement('span');
                startNameSpan.classList.add('attribute');
                startNameSpan.innerText = ` ${name}`;
                start.appendChild(startNameSpan);

                if(value != ''){
                    
                    let _value;
                    if(name == 'class'){
                        const splitted = value.split(' ');
                        const filtered = splitted.filter((c) => c !== 'render-tag');

                        _value = filtered.join(' ');
                    }else{
                        _value = value;
                    }
                    const valueSpan = document.createElement('span');
                    valueSpan.classList.add('value');
                    valueSpan.innerText = `"${_value}"`;
                    const equalSpan = document.createElement('span');
                    equalSpan.innerText = '=';
                    start.appendChild(equalSpan);
                    start.appendChild(valueSpan);

                }
                
            }

            
            
        })
    },

    

    createTagElms:() => {
        const start = document.createElement('div');
        const end = document.createElement('div');
        const wrapper = document.createElement('div');
        start.classList.add('tag');
        start.classList.add('start');
        end.classList.add('tag');
        end.classList.add('end');
        wrapper.classList.add('render-tag-wrapper');
        
        return{
            start: start,
            end: end,
            wrapper: wrapper
        }
    }
    
}

