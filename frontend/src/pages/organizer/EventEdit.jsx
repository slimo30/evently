import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../../api';
import { ChevronLeft, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
import ImageCropper from '../../components/ImageCropper';

const EventEdit = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Tech',
        location: '',
        date_start: '',
        date_end: '',
        max_participants: 100,
        tags: '',
        status: 'DRAFT'
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const event = await api.getEvent(id);
                setFormData({
                    ...event,
                    tags: event.tags.join(', ')
                });
                setImagePreview(getImageUrl(event.image_url));
            } catch (err) {
                console.error(err);
                alert('Failed to load event');
            }
            setLoading(false);
        };
        fetchEvent();
    }, [id]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                max_participants: parseInt(formData.max_participants)
            };

            await api.updateEvent(id, payload);

            if (imageFile) {
                await api.uploadEventImage(id, imageFile);
            }

            navigate('/organizer/events');
        } catch (err) {
            alert(err.message);
        }
        setSaving(false);
    };

    if (loading) return <div className="loading-state">Loading event data...</div>;

    return (
        <div className="event-edit">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ChevronLeft size={20} /> Back
                </button>
                <h1>Edit Event</h1>
            </header>

            <form onSubmit={handleSubmit} className="edit-form card">
                <div className="form-grid">
                    <div className="form-main">
                        <div className="input-group">
                            <label>Event Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Give your event a clear name"
                            />
                        </div>

                        <div className="input-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="8"
                                placeholder="Describe what makes your event special..."
                            />
                        </div>

                        <div className="row">
                            <div className="input-group col">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    {['Tech', 'Music', 'Art', 'Sports', 'Food', 'Business', 'Education'].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group col">
                                <label>Max Participants</label>
                                <input
                                    type="number"
                                    name="max_participants"
                                    value={formData.max_participants}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Location</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="Venue name or address"
                            />
                        </div>

                        <div className="row">
                            <div className="input-group col">
                                <label>Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    name="date_start"
                                    value={formData.date_start ? formData.date_start.substring(0, 16) : ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-group col">
                                <label>End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    name="date_end"
                                    value={formData.date_end ? formData.date_end.substring(0, 16) : ''}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-sidebar">
                        <div className="input-group">
                            <label>Event Banner</label>
                            <div className="image-upload-box" onClick={() => document.getElementById('hero-upload').click()}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" />
                                ) : (
                                    <div className="upload-placeholder">
                                        <ImageIcon size={40} />
                                        <span>Click to upload banner</span>
                                    </div>
                                )}
                                <input id="hero-upload" type="file" hidden accept="image/*" onChange={handleImageSelect} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Tags (comma separated)</label>
                            <input
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="workshop, tech, free"
                            />
                        </div>

                        <div className="input-group">
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published (Requires Approval)</option>
                            </select>
                        </div>

                        <div className="form-actions mt-4">
                            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                                <Save size={18} /> {saving ? 'Saving...' : 'Update Event'}
                            </button>
                            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary btn-full mt-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <style jsx>{`
                @media (max-width: 992px) {
                    .edit-form { padding: 1.5rem; }
                    .form-grid { grid-template-columns: 1fr; gap: 2rem; }
                    .row { flex-direction: column; gap: 1rem; }
                }

                @media (max-width: 600px) {
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

export default EventEdit;
