import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ChevronLeft, Save, Image as ImageIcon, Calendar, MapPin, AlignLeft, Plus } from 'lucide-react';
import ImageCropper from '../../components/ImageCropper';

const EventCreate = ({ user }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'tech',
        location: '',
        date_start: '',
        date_end: '',
        max_participants: 100,
        tags: []
    });
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedBlob) => {
        setShowCropper(false);
        setImageFile(croppedBlob);
        setImagePreview(URL.createObjectURL(croppedBlob));
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const event = await api.createEvent(formData);
            if (imageFile) {
                await api.uploadEventImage(event.id, imageFile);
            }
            navigate('/organizer/events');
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="event-create">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20} /> Back
                </button>
                <h1>Create New Event</h1>
            </header>

            <form onSubmit={handleSubmit} className="create-form-layout">
                <div className="form-main">
                    <div className="card form-section">
                        <div className="section-header">
                            <AlignLeft size={18} />
                            <h3>Basic Information</h3>
                        </div>
                        <div className="form-group">
                            <label>Event Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Annual Tech Summit 2026"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                rows="6"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Tell people what your event is about..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="card form-section">
                        <div className="section-header">
                            <ImageIcon size={18} />
                            <h3>Event Media</h3>
                        </div>
                        <div className="image-upload-zone" onClick={() => document.getElementById('image-upload').click()}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="preview-image" />
                            ) : (
                                <div className="upload-placeholder">
                                    <ImageIcon size={48} />
                                    <p>Click to upload event banner</p>
                                    <span>Recommended: 1200x600px (JPG, PNG)</span>
                                </div>
                            )}
                            <input
                                id="image-upload"
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-sidebar">
                    <div className="card form-section">
                        <div className="section-header">
                            <Calendar size={18} />
                            <h3>When & Where</h3>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <div className="input-icon-wrap">
                                <MapPin size={16} />
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Venue or City"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Start Date & Time</label>
                            <input
                                type="datetime-local"
                                name="date_start"
                                required
                                value={formData.date_start}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date & Time</label>
                            <input
                                type="datetime-local"
                                name="date_end"
                                required
                                value={formData.date_end}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="card form-section">
                        <div className="section-header">
                            <Plus size={18} />
                            <h3>Details</h3>
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="tech">Tech</option>
                                <option value="music">Music</option>
                                <option value="art">Art</option>
                                <option value="sports">Sports</option>
                                <option value="food">Food</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Capacity</label>
                            <input
                                type="number"
                                name="max_participants"
                                value={formData.max_participants}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tags (Press Enter)</label>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Python, Networking..."
                            />
                            <div className="tags-preview">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="tag-pill">
                                        {tag} <button type="button" onClick={() => removeTag(tag)}>×</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        <Save size={20} /> {loading ? 'Creating...' : 'Launch Event'}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .event-create { max-width: 1100px; margin: 0 auto; }
        .btn-back { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-weight: 600; margin-bottom: 1rem; }
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-size: 2.25rem; font-family: 'Outfit'; }

        .create-form-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; align-items: start; }
        .form-section { padding: 2rem; margin-bottom: 0; border: none; }
        .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; color: var(--primary); }
        .section-header h3 { font-family: 'Outfit'; font-size: 1.1rem; }

        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-main); }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%; padding: 0.75rem 1rem; border: 1.5px solid var(--border);
          border-radius: var(--radius-sm); font-size: 1rem; background: var(--bg-main);
          color: var(--text-main); transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light);
        }
        .input-icon-wrap { position: relative; display: flex; align-items: center; gap: 0.5rem; }
        .input-icon-wrap svg { position: absolute; left: 0.75rem; color: var(--text-muted); }
        .input-icon-wrap input { padding-left: 2.5rem; }

        .image-upload-zone {
          width: 100%; aspect-ratio: 2 / 1; border: 2px dashed var(--border);
          border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
          cursor: pointer; overflow: hidden; transition: all 0.2s; background: var(--bg-main);
        }
        .image-upload-zone:hover { border-color: var(--primary); background: var(--primary-light); }
        .preview-image { width: 100%; height: 100%; object-fit: cover; }
        .upload-placeholder { text-align: center; color: var(--text-muted); }
        .upload-placeholder p { margin: 1rem 0 0.25rem; font-weight: 600; }
        .upload-placeholder span { font-size: 0.8rem; }

        .tags-preview { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
        .tag-pill { display: flex; align-items: center; gap: 0.35rem; background: var(--primary-light); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .tag-pill button { color: var(--primary); opacity: 0.7; font-size: 1.1rem; line-height: 1; }
        .btn-full { width: 100%; justify-content: center; margin-top: 1rem; }

        @media (max-width: 992px) {
          .create-form-layout { grid-template-columns: 1fr; gap: 1rem; }
          .form-section { padding: 1.5rem; margin-bottom: 1rem; }
          .page-header h1 { font-size: 1.75rem; }
        }
      `}</style>
            {showCropper && (
                <ImageCropper
                    image={selectedImage}
                    aspect={2} // Using 2:1 for event banners
                    onCropComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                />
            )}
        </div>
    );
};

export default EventCreate;
