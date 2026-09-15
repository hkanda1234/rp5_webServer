import { superEllipse } from "./superEllipse.js";

export const cursor = {
    create: (svgElm, wrapper) => {
        const c = {
            svgElm: svgElm,
            wrapper: wrapper,

            startTime: null,
            startXY: null,
            currentXY: null,
            targetXY: null,

            hoverTargets: null,
            isHovering: false,
            
            defaultSEWH: {
                w: 50,
                h: 50
            },
            defaultSESegment: 50,
            defaultSER: 1,
            defaultSEK: 2,
            defaultSESW: 1,
            defaultSESC: 'white',
            defaultSEFC: 'transparent',
            se: null,

            animId: null,
            elapsed: 0,
            normalized: 0,

            defaultMoveDuration: 100,
            moveDuration: null,
            
            fullShrinkDistance: 100,
            fullShrinkSER: 0.1,
            
            isHovering: false,
            hoverMoveDuration: 200,
            hoverMargin: 50,
            hoverK: 8,



            start: function(hoverTargets){
                c.se = superEllipse.create(c.svgElm, c.defaultSER, c.defaultSEK, c.defaultSESegment, c.defaultSESW, c.defaultSESC, c.defaultSEFC),
                c.moveDuration = c.defaultMoveDuration;
                document.querySelector('body').addEventListener('mousemove', c.onMousemove);
                this.addHoverCallback(hoverTargets);
            },

            addHoverCallback: function(targets){
                targets.forEach((e) => {
                    e.addEventListener('mouseenter', c.onMouseenter);
                    e.addEventListener('mouseout', c.onMouseout);
                })
            },

            onMousemove: function(e){
                c.move(e);
            },

            onMouseenter: function(e){
                const t = e.target;
                const rect = t.getBoundingClientRect();
                const x = rect.x + rect.width / 2;
                const y = rect.y + rect.height / 2;

                c.targetXY = {
                    x: x,
                    y: y
                }

                c.startXY = {
                    x: c.currentXY.x,
                    y: c.currentXY.y
                }

                console.log(rect);
                c.moveDuration = c.hoverMoveDuration;
                c.isHovering = true;

                c.se.changeWH({w: rect.width + c.hoverMargin, h: rect.height + c.hoverMargin}, c.hoverMoveDuration / 1000);
                c.se.changeK(c.hoverK, c.hoverMoveDuration / 1000);
                requestAnimationFrame((t) => c.firstFrame(t));
                
            },

            onMouseout: function(e){
                c.moveDuration = c.defaultMoveDuration;
                c.isHovering = false;

                c.se.changeWH(c.defaultSEWH, c.moveDuration / 1000);
                c.se.changeK(c.defaultSEK, c.moveDuration / 1000);
            },

            move: function(e){

                if(!c.currentXY){
                    c.currentXY = {
                        x: e.x,
                        y: e.y
                    }
                }

                c.startXY = {
                    x: c.currentXY.x,
                    y: c.currentXY.y
                }
                
                if(!c.isHovering){
                    
                    c.targetXY = {
                        x: e.x,
                        y: e.y
                    }
                }

                

                requestAnimationFrame((t) => c.firstFrame(t));
            },

            firstFrame: function(t){
                c.startTime = t;
                c.animId = requestAnimationFrame(c.animFrame);
            },

            animFrame: function(timestamp){
                c.elapsed = timestamp - c.startTime;
                c.normalized = c.elapsed / c.moveDuration;

                const s = c.startXY;
                const t = c.targetXY;
                const vec = {
                    x: t.x - s.x,
                    y: t.y - s.y
                }

                const ease = c.easeIn(c.normalized);
                console.log(ease);

                const x = s.x + vec.x * ease;
                const y = s.y + vec.y * ease;

                c.currentXY = {
                    x: x,
                    y: y
                }


                c.wrapper.style.translate = `${c.currentXY.x}px ${c.currentXY.y}px`;

                if(!c.isHovering){
                    
                    const r = Math.max(1 - Math.sqrt(vec.x * vec.x + vec.y * vec.y) / c.fullShrinkDistance, c.fullShrinkSER);
                    c.se.r = r;
                    c.se.update();
                } else {
                    c.se.r = c.defaultSER;
                    c.se.update();
                }

                if(c.elapsed < c.moveDuration){
                    
                    requestAnimationFrame(c.animFrame);
                } else {

                    c.currentXY.x = c.targetXY.x;
                    c.currentXY.y = c.targetXY.y;
                    c.wrapper.style.translate = `${c.targetXY.x}px ${c.targetXY.y}px`;
                    
                }

            },

            easeIn: function(t){
                return - Math.pow(t - 1, 2) + 1;
            }

            

        }
        return c;
    } 
}
