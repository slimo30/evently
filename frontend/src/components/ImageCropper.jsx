import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

const ImageCropper = ({ image, onCropComplete, onCancel, circular = false, aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="cropper-overlay">
      <div className="cropper-modal glass">
        <div className="cropper-header">
          <h3>Edit Image</h3>
          <button onClick={onCancel} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="cropper-wrapper">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circular ? 'round' : 'rect'}
            showGrid={!circular}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="cropper-controls">
          <div className="zoom-slider">
            <ZoomOut size={16} />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="zoom-range"
            />
            <ZoomIn size={16} />
          </div>

          <div className="cropper-actions">
            <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCrop} className="btn btn-primary">
              <Check size={18} /> Apply Crop
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cropper-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .cropper-modal {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cropper-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .cropper-wrapper {
          position: relative;
          width: 100%;
          height: 350px;
          background: #333;
        }
        .cropper-controls {
          padding: 1.5rem;
          background: white;
        }
        .zoom-slider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: var(--text-muted);
        }
        .zoom-range {
          flex-grow: 1;
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          appearance: none;
          outline: none;
        }
        .zoom-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
        }
        .cropper-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .btn-close {
          color: var(--text-muted);
          padding: 0.5rem;
          border-radius: 50%;
        }
        .btn-close:hover {
          background: var(--bg-main);
          color: var(--text-main);
        }
        .btn-secondary {
          background: var(--bg-main);
          color: var(--text-main);
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
};

// Helper function to create the cropped image
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        // Wrap in a File so the backend receives a proper filename + MIME type
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    };
    image.onerror = (error) => reject(error);
  });
};

export default ImageCropper;
