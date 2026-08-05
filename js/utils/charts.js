// ========================================
// SIMPLE CANVAS CHARTS
// ========================================

const Charts = {
    colors: [
        '#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        '#14b8a6', '#f43f5e'
    ],

    drawDonut(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Fix: ensure minimum size
        const parentWidth = canvas.parentElement.clientWidth || 300;
        const size = Math.max(150, Math.min(parentWidth, 200));

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = Math.max(20, size / 2 - 10);
        const innerRadius = Math.max(10, radius * 0.6);
        const total = data.reduce((sum, d) => sum + d.value, 0);

        if (total === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#f1f5f9';
            ctx.fill();

            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#94a3b8';
            ctx.font = '500 13px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Pas de données', centerX, centerY);
            return;
        }

        let startAngle = -Math.PI / 2;

        data.forEach((item, i) => {
            const sliceAngle = (item.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color || this.colors[i % this.colors.length];
            ctx.fill();

            startAngle = endAngle;
        });

        // Center text
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#0f172a';
        ctx.font = '800 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(CurrencyUtils.format(total), centerX, centerY - 8);

        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748b';
        ctx.font = '500 11px Inter';
        ctx.fillText('Total', centerX, centerY + 10);
    },

    drawLine(canvasId, labels, datasets, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const parentWidth = canvas.parentElement.clientWidth || 300;
        const width = Math.max(200, parentWidth - 40);
        const height = 200;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 10, bottom: 30, left: 50 };
        const chartW = Math.max(50, width - padding.left - padding.right);
        const chartH = Math.max(50, height - padding.top - padding.bottom);

        let maxVal = 0;
        datasets.forEach(ds => {
            ds.data.forEach(v => { if (v > maxVal) maxVal = v; });
        });
        if (maxVal === 0) maxVal = 100;
        maxVal = Math.ceil(maxVal * 1.1);

        const gridLines = 4;
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.textAlign = 'right';

        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartH / gridLines) * i;
            const val = maxVal - (maxVal / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            ctx.fillText(Math.round(val).toString(), padding.left - 8, y + 3);
        }

        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(labels.length / 7));
        labels.forEach((label, i) => {
            if (i % step === 0 || i === labels.length - 1) {
                const x = padding.left + (chartW / Math.max(labels.length - 1, 1)) * i;
                ctx.fillText(label, x, height - 8);
            }
        });

        datasets.forEach((ds, dsIdx) => {
            const color = ds.color || this.colors[dsIdx];
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ds.data.forEach((val, i) => {
                const x = padding.left + (chartW / Math.max(ds.data.length - 1, 1)) * i;
                const y = padding.top + chartH - (val / maxVal) * chartH;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
            gradient.addColorStop(0, color + '30');
            gradient.addColorStop(1, color + '00');

            ctx.lineTo(padding.left + chartW, padding.top + chartH);
            ctx.lineTo(padding.left, padding.top + chartH);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ds.data.forEach((val, i) => {
                const x = padding.left + (chartW / Math.max(ds.data.length - 1, 1)) * i;
                const y = padding.top + chartH - (val / maxVal) * chartH;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        });
    },

    drawBar(canvasId, labels, data, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const parentWidth = canvas.parentElement.clientWidth || 300;
        const width = Math.max(200, parentWidth - 40);
        const height = 200;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 10, bottom: 40, left: 50 };
        const chartW = Math.max(50, width - padding.left - padding.right);
        const chartH = Math.max(50, height - padding.top - padding.bottom);

        let maxVal = Math.max(...data, 1);
        maxVal = Math.ceil(maxVal * 1.1);

        const barWidth = Math.max(10, Math.min(30, (chartW / Math.max(data.length, 1)) * 0.6));
        const gap = Math.max(4, (chartW - barWidth * data.length) / (data.length + 1));

        const gridLines = 4;
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.textAlign = 'right';

        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartH / gridLines) * i;
            const val = maxVal - (maxVal / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            ctx.fillText(Math.round(val).toString(), padding.left - 8, y + 3);
        }

        data.forEach((val, i) => {
            const x = padding.left + gap + (barWidth + gap) * i;
            const barH = (val / maxVal) * chartH;
            const y = padding.top + chartH - barH;
            const color = colors ? (colors[i] || this.colors[i % this.colors.length]) : this.colors[i % this.colors.length];

            const r = Math.min(4, barWidth / 2);
            ctx.beginPath();
            ctx.moveTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
            ctx.lineTo(x + barWidth, padding.top + chartH);
            ctx.lineTo(x, padding.top + chartH);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#94a3b8';
            ctx.font = '400 9px Inter';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - 5);
            ctx.rotate(-0.3);
            const shortLabel = labels[i].length > 6 ? labels[i].substring(0, 6) + '.' : labels[i];
            ctx.fillText(shortLabel, 0, 0);
            ctx.restore();
        });
    }
};
