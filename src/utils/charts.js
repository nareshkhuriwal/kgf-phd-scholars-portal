export function downloadChartAsPng(chartId, fileName = 'chart.png') {
    const svg = document.querySelector(`#${chartId} svg`);
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);

    const canvas = document.createElement('canvas');
    const bbox = svg.getBoundingClientRect();
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgStr], {
        type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    img.src = url;
}
