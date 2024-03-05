document.addEventListener("DOMContentLoaded", function () {
    console.log('loaded')
    const drawingArea = document.getElementById("drawingArea");
    const previewDrawingArea = document.getElementById("previewDrawingArea");
    const colorPicker = document.getElementById("colorPicker");
    const brushSize = document.getElementById("brushSize");
    const angleInput = document.getElementById("angle");
    const clearBtn = document.getElementById("clearBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const colorButtons = document.querySelectorAll(".color-btn");
    const previewBtn = document.getElementById("previewBtn");
    const modal = document.getElementById("modal");
    const emailInput = document.getElementById("email");
    const drawSignatureModalCloseHandler = document.getElementById("drawSignatureModalCloseHandler");

    let isDrawing = false;
    let currentColor = colorPicker.value;
    let currentAngle = angleInput.value;
    let currentFontSize = brushSize.value;
    let lastX = 0;
    let lastY = 0;
    let paths = [];

    function startDrawing(e) {
        isDrawing = true;
        const point = getEventPoint(e);
        lastX = point.x;
        lastY = point.y;
        const pathElement = createPathElement(lastX, lastY);
        drawingArea.appendChild(pathElement);
        paths.push(pathElement);
        pathElement.setAttribute("stroke", "gray");
        previewBtn.classList.remove("disabled");
        updateDownloadButton();
    }

    function draw(e) {
        e.preventDefault();
        if (!isDrawing) return;

        const point = getEventPoint(e);
        const dx = point.x - lastX;
        const dy = point.y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const minDistance = 5;

        if (distance > minDistance) {
            const angle = Math.atan2(dy, dx);
            const steps = Math.ceil(distance / minDistance);

            for (let i = 0; i < steps; i++) {
                const x = lastX + Math.cos(angle) * minDistance * i;
                const y = lastY + Math.sin(angle) * minDistance * i;
                const newPathData = `${paths[paths.length - 1].getAttribute("d")} L ${x},${y}`;
                paths[paths.length - 1].setAttribute("d", newPathData);
            }
            lastX = point.x;
            lastY = point.y;
        }
    }

    function endDrawing() {
        isDrawing = false;
        paths.forEach((path) => {
            path.setAttribute("stroke", currentColor);
        });
        updateDownloadButton();
    }

    function clearDrawing() {
        drawingArea.innerHTML = "";
        paths = [];
        colorPicker.value = "#000000";
        brushSize.value = 5;
        angleInput.value = 0;
        currentColor = colorPicker.value;
        currentAngle = angleInput.value;
        currentFontSize = brushSize.value;
        emailInput.value = "";

        updateDownloadButton();
        previewBtn.classList.add("disabled");

        // Empty the previewDrawingArea
        previewDrawingArea.innerHTML = "";
    }
    drawSignatureModalCloseHandler.addEventListener("click", clearDrawing);

    function downloadDrawing() {
        if (paths.length > 0) {
            renderDrawingInPreviewArea();
            const svgData = new XMLSerializer().serializeToString(drawingArea);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const img = new Image();

            img.onload = function () {
                canvas.width = drawingArea.getBoundingClientRect().width;
                canvas.height = drawingArea.getBoundingClientRect().height;
                context.drawImage(img, 0, 0);

                const dataUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = "drawing.png";
                link.click();
            };

            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    }

    function renderDrawingInPreviewArea() {
        if (paths.length > 0) {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = drawingArea.clientWidth;
            canvas.height = drawingArea.clientHeight;
            const svgData = new XMLSerializer().serializeToString(drawingArea);
            const img = new Image();
            modal.style.display = "block";

            img.onload = function () {
                context.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                const previewImage = document.createElement("img");
                previewImage.src = dataUrl;
                previewImage.alt = "Drawing Preview";
                previewDrawingArea.innerHTML = "";
                previewDrawingArea.appendChild(previewImage);
                modal.style.display = "block";
            };

            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        } else {
            modal.style.display = "none";
        }
    }

    function setColorFromPicker() {
        currentColor = colorPicker.value;
        paths.forEach((path) => {
            path.setAttribute("stroke", currentColor);
        });
    }

    function setColorFromButton(button) {
        currentColor = button.style.backgroundColor;
        paths.forEach((path) => {
            path.setAttribute("stroke", currentColor);
        });
    }

    function updateAngle() {
        currentAngle = angleInput.value;
        rotatePaths(currentAngle);
    }

    function updateFontSize() {
        currentFontSize = brushSize.value;
        paths.forEach((path) => {
            path.setAttribute("stroke-width", currentFontSize);
        });
    }

    function rotatePaths(angle) {
        const centerX = drawingArea.clientWidth / 2;
        const centerY = drawingArea.clientHeight / 2;
        paths.forEach((path) => {
            path.style.transformOrigin = `${centerX}px ${centerY}px`;
            path.style.transform = `rotate(${angle}deg)`;
        });
    }

    function createPathElement(x, y) {
        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("stroke", currentColor);
        pathElement.setAttribute("stroke-width", currentFontSize);
        pathElement.setAttribute("stroke-linecap", "round");
        pathElement.setAttribute("fill", "none");
        pathElement.setAttribute("d", `M ${x},${y}`);
        return pathElement;
    }

    function getEventPoint(e) {
        const svgPoint = drawingArea.createSVGPoint();
        svgPoint.x = e.clientX || e.touches[0].clientX;
        svgPoint.y = e.clientY || e.touches[0].clientY;
        return svgPoint.matrixTransform(drawingArea.getScreenCTM().inverse());
    }

    function updateDownloadButton() {
        if (paths.length > 0 && validateEmail(emailInput.value.trim())) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = "1";
            downloadBtn.style.cursor = "pointer";
        } else {
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = "0.5";
            downloadBtn.style.cursor = "not-allowed";
        }
    }
    function validateEmail(email) {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    drawingArea.addEventListener("mousedown", startDrawing);
    drawingArea.addEventListener("touchstart", startDrawing);
    drawingArea.addEventListener("mousemove", draw);
    drawingArea.addEventListener("touchmove", draw);
    drawingArea.addEventListener("mouseup", endDrawing);
    drawingArea.addEventListener("touchend", endDrawing);
    drawingArea.addEventListener("mouseleave", endDrawing);
    clearBtn.addEventListener("click", clearDrawing);
    downloadBtn.addEventListener("click", downloadDrawing);
    colorPicker.addEventListener("input", setColorFromPicker);
    angleInput.addEventListener("input", updateAngle);
    brushSize.addEventListener("input", updateFontSize);
    colorButtons.forEach((button) => {
        button.addEventListener("click", () => setColorFromButton(button));
    });

    previewBtn.addEventListener("click", function () {
        renderDrawingInPreviewArea();
    });

    emailInput.addEventListener("input", updateDownloadButton);

    updateDownloadButton();

    previewBtn.classList.add("disabled");
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = "0.5";
    downloadBtn.style.cursor = "not-allowed";
});
