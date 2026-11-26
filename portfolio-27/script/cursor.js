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
            defaultSER: {x: 1, y: 1},
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
            fullShrinkSER: {x: 0.1, y: 0.1},
            
            isHovering: false,
            hoveringTarget: null,
            hoverMoveDuration: 200,
            hoverMargin: 50,
            hoverK: 12,



            start: function(hoverTargets){
                c.se = superEllipse.create(c.svgElm, c.defaultSER, c.defaultSEK, c.defaultSESegment, c.defaultSESW, c.defaultSESC, c.defaultSEFC),
                c.moveDuration = c.defaultMoveDuration;
                document.querySelector('body').addEventListener('mousemove', c.onMousemove);
                c.addHoverCallback(hoverTargets);
                c.addScrollendCallback();
            },

            addHoverCallback: function(targets){
                targets.forEach((e) => {
                    e.addEventListener('mouseenter', c.onMouseenter);
                    e.addEventListener('mouseout', c.onMouseout);
                })
            },

            addScrollendCallback :function(){
                document.addEventListener('scroll', () => {
                    if(!this.isHovering)return;
                    c.fixHovering();
                    requestAnimationFrame((t) => c.firstFrame(t));

                    console.log('fix')
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

                c.hoveringTarget = t;

                c.targetXY = {
                    x: x,
                    y: y
                }

                c.startXY = {
                    x: x,
                    y: y
                }

                c.moveDuration = c.hoverMoveDuration;
                c.isHovering = true;

                c.se.changeWH({w: rect.width + c.hoverMargin, h: rect.height + c.hoverMargin}, c.hoverMoveDuration / 1000);
                c.se.changeK(c.hoverK, c.hoverMoveDuration / 1000);
                requestAnimationFrame((t) => c.firstFrame(t));
                
            },

            onMouseout: function(e){
                c.moveDuration = c.defaultMoveDuration;
                c.isHovering = false;
                c.targetXY = {
                    x: e.x,
                    y: e.y
                }
                requestAnimationFrame((t) => c.firstFrame(t));

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
                } else {
                    c.fixHovering();
                }

                

                requestAnimationFrame((t) => c.firstFrame(t));
            },

            fixHovering(){
                const r = c.hoveringTarget.getBoundingClientRect();
                const l = r.x;
                const t = r.y;
                const w = r.width;
                const h = r.height;
                c.targetXY = {
                    x: l + w / 2,
                    y: t + h / 2
                }
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

                const x = s.x + vec.x * ease;
                const y = s.y + vec.y * ease;

                c.currentXY = {
                    x: x,
                    y: y
                }


                c.wrapper.style.translate = `${c.currentXY.x}px ${c.currentXY.y}px`;

                if(!c.isHovering){
                    
                    const r = Math.max(1 - Math.sqrt(vec.x * vec.x + vec.y * vec.y) / c.fullShrinkDistance, c.fullShrinkSER.x);
                    c.se.r = {x: r, y: r};
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
