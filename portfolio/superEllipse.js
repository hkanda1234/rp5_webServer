

export const superEllipse = {

    create: (svgElement, r = 1, k = 2, segment, strokeWidth = 1, strokeColor = 'black', fillColor = 'white') => {
        
        const se = {

            svgElement: svgElement,
            width: parseInt(svgElement.getAttribute('width')),
            height: parseInt(svgElement.getAttribute('height')),
            

            
            segment: segment,
            
            r: r,
            k: k,
            
            sw: strokeWidth,
            sc: strokeColor,
            fc: fillColor,

            raw: {
                x: [],
                y: []
            },

            svg: {text: ""},
            
            updateRaw: () => {
                
                se.raw.x = [];
                se.raw.y = [];
                const TWOPI = Math.PI * 2;
                let i = 0;
                let tt;

                for(let t = 0; t < se.segment; t ++){
                    tt = t / se.segment * TWOPI;
                    se.raw.x.push(Math.sign(Math.cos(tt)) * Math.pow(Math.abs(Math.cos(tt)), 2 / se.k) * se.r);
                    se.raw.y.push(Math.sign(Math.sin(tt)) * Math.pow(Math.abs(Math.sin(tt)), 2 / se.k) * se.r);
                    i++;
                }
            },

            updateSVG: () => {
                let path = "";
                const start = se.convertXY(se.raw.x[0], se.raw.y[0]);
                path = `M ${start.x},${start.y} `;
                let line;
                let next;

                for(let i = 1; i < se.segment; i++){
                    next = se.convertXY(se.raw.x[i], se.raw.y[i]);
                    line = `L ${next.x},${next.y} `;
                    path += line;
                }
                path += "z";
                se.svg.text = `<path stroke="${se.sc}" stroke-width="${se.sw}" fill="${se.fc}" d="${path}" />`;
            },

            convertXY: (x, y) => {
                return {
                    x: x * (se.width - se.sw) / 2 + (se.width / 2),
                    y: y * (se.height - se.sw) / 2 + (se.height / 2),
                }
            },

            update: () => {
                se.updateRaw();
                se.updateSVG();
                se.svgElement.innerHTML = se.svg.text;
                se.svgElement.setAttribute('width', se.width);
                se.svgElement.setAttribute('height', se.height);
            },

            changeKAnimStartTime: null,
            changeKAnimStop: null,
            changeKAnimStart: null,
            changeKAnimTarget: null,
            changeKAnimDuration: null,

            changeRAnimStartTime: null,
            changeRAnimStop: null,
            changeRAnimStart: null,
            changeRAnimTarget: null,
            changeRAnimDuration: null,

            changeWHAnimStartTime: null,
            changeWHAnimStop: null,
            changeWHAnimStart: {w: null, h: null},
            changeWHAnimTarget: {w: null, h: null},
            changeWHAnimDuration: null,

            changeR: (target, duration) => {
                if(se.changeRAnimStop){
                    se.cancelChangeRAnim();
                }

                se.changeRAnimStart = se.r;
                se.changeRAnimTarget = target;
                se.changeRAnimDuration = duration;
                se.changeRAnimStartTime = performance.now();
                se.changeRAnim();
            },

            changeK: (target, duration) => {

                if(se.changeKAnimStop){
                    se.cancelChangeKAnim();
                }

                se.changeKAnimStart = se.k;
                se.changeKAnimTarget = target;
                se.changeKAnimDuration = duration;
                se.changeKAnimStartTime = performance.now();
                se.changeKAnim();
                
            },

            changeWH: (target, duration) => {
                if(se.changeWHAnimStop){
                    se.cancelChangeWHAnim();
                }

                se.changeWHAnimStart.w = se.width;
                se.changeWHAnimStart.h = se.height;
                se.changeWHAnimTarget.w = target.w;
                se.changeWHAnimTarget.h = target.h;
                se.changeWHAnimDuration = duration;
                se.changeWHAnimStartTime = performance.now();
                se.changeWHAnim();

            },

            changeRAnim: (timestamp) => {

                se.changeRAnimStop = requestAnimationFrame(se.changeRAnim);
                const now = performance.now();

                const start = se.changeRAnimStart;
                const target = se.changeRAnimTarget;
                const range = target - start;
                const t = ((now - se.changeRAnimStartTime) / 1000) / se.changeRAnimDuration;

                const current = t * t;

                if(t > 1) {
                    se.stopChangeRAnim();
                    return;
                }

                se.r = start + range * current;
                se.update();

            },
            
            changeKAnim: (timestamp) => {

                se.changeKAnimStop = requestAnimationFrame(se.changeKAnim);
                if(!timestamp) return;


                const start = se.changeKAnimStart;
                const target = se.changeKAnimTarget;
                const range = target - start;
                const t = ((timestamp - se.changeKAnimStartTime ) / 1000) / se.changeKAnimDuration;
                
                const current = t * t;
                
                if(t > 1) {
                    se.stopChangeKAnim();
                    return;
                };
                
                se.k = start + range * current;
                se.update();
                
                
            },

            changeWHAnim: (timestamp) => {
                se.changeWHAnimStop = requestAnimationFrame(se.changeWHAnim);
                if(!timestamp) return;

                const start = se.changeWHAnimStart;
                const target = se.changeWHAnimTarget;
                const range = {
                    w: target.w - start.w,
                    h: target.h - start.h,
                }
                const t = ((timestamp - se.changeWHAnimStartTime) / 1000) / se.changeWHAnimDuration;

                const current = t * t;

                if(t > 1) {
                    se.stopChangeWHAnim();
                    return;
                }

                se.width = start.w + range.w * current;
                se.height = start.h + range.h * current;
            },

            stopChangeRAnim: () => {
                cancelAnimationFrame(se.changeRAnimStop);
                se.r = se.changeKAnimTarget;
                se.changeRAnimStop = null;
                se.update();

            },
            
            stopChangeKAnim: () => {
                cancelAnimationFrame(se.changeKAnimStop);
                se.k = se.changeKAnimTarget;
                se.changeKAnimStop = null;
                se.update();
                console.log('stop');
            },

            stopChangeWHAnim: () => {
                cancelAnimationFrame(se.changeWHAnimStop);
                se.width = se.changeWHAnimTarget.w;
                se.height = se.changeWHAnimTarget.h;
                se.update();

            },

            cancelChangeRAnim: () => {
                cancelAnimationFrame(se.changeRAnimStop);
                se.changeRAnimStop = null;
                se.update();
            },

            cancelChangeKAnim: () => {
                cancelAnimationFrame(se.changeKAnimStop);
                se.changeKAnimStop = null;
                se.update();
                console.log('cancel');
            },

            cancelChangeWHAnim: () => {
                cancelAnimationFrame(se.changeWHAnimStop);
                se.changeWHAnimStop = null;
                se.update();

            },

            




            
        };

        se.update();
        return se;
    }

}
