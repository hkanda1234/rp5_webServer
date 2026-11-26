


export const overlayManager = {
    overlayElm: document.querySelector('.overlay'),
    workIframeContainer: document.querySelector('.work-iframe-container'),
    workAnchors: document.querySelectorAll('.work-anchor'),

    listenAnchores: () => {
        const self = overlayManager;
        self.workAnchors.forEach((e) => {
            e.addEventListener('click', self.onAnchorClicked);

        });
    },

    onAnchorClicked: (e) => {
        const self = overlayManager;
        e.preventDefault();
        console.log('anchor clicked');
        const href = e.target.href;
        
        const url = new URL(href);
        const content = url.searchParams.get('content');
        const src = url.searchParams.get('src');

        console.log(e, href, content, src);
        
        history.pushState(
            {
                overlay: {
                    content: content,
                    src: src
                }
            },
            "",
            new URL(href)
        );

        self.render();
    },

    start: () => {
        const self = overlayManager;
        const state = history.state;

        self.listenAnchores();
        
        if(state === null){
            //from other origin
            const params = new URL(location).searchParams;
            console.log(params);
            const content = params.get('content');
            const src = params.get('src');

            history.pushState(
                {
                    overlay: {
                        content: content,
                        src: src,
                    }
                },
                "",
                new URL(location)
            )

        }else{
            //from same origin
            const params = new URL(location).searchParams;
            const content = params.get('content');
            const src = params.get('src');

            console.log(params);

            history.pushState(
                {
                    overlay: {
                        content: content,
                        src: src
                    }
                },
                "",
                ""
            )
        }
        self.render();
        console.log("state: ", history.state);
    },

    onPopState: window.addEventListener('popstate', (e) => {
        console.log(e);
        overlayManager.start();
    }),

    render: () => {
        const self = overlayManager;
        const state = history.state;
        const content = state.overlay.content; // null or "null"
        const src = state.overlay.src;

        if(!content || content === 'null'){
            self.hideOverlay();
            self.workIframeContainer.innerHTML = '';
        }else{
            self.showOverlay();
            if(content === "work"){
                const workIframe = document.createElement("iframe");
                console.log(workIframe);
                self.workIframeContainer.before(workIframe);
                self.workIframeContainer.appendChild(workIframe);
                workIframe.src = src;
            }
        }



    },

    hideOverlay: () => {
        const self = overlayManager;
        if(self.overlayElm.classList.contains('hidden')){
            return;
        }
        self.overlayElm.classList.add('hidden');
        console.log("hide overlay");
    },

    showOverlay: () => {
        const self = overlayManager;
        if(self.overlayElm.classList.contains('hidden')){
            self.overlayElm.classList.remove('hidden');
            console.log('show overlay');
        }
    }


}