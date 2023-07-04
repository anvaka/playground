const cache = new Map();

export default function getImage(url) {
    let loadedImage = cache.get(url);
    if (loadedImage) {
        return Promise.resolve(loadedImage);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = function () {
            let width = this.width;
            let height = this.height;
            let loadedImage = {img, width, height};
            cache.set(url, loadedImage);
            resolve(loadedImage);
        };
        img.onerror = reject;
        img.src = url;
    });
}