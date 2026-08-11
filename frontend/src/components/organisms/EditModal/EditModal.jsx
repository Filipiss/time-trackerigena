import { X } from 'lucide-react';
import Button from '../../atoms/Button/Button';
import './EditModal.css';

export default function EditModal({ title, isOpen, onClose, onSave, children }) {
    if (!isOpen) return null;

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal-content fade-in" onClick={e => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h3>{title}</h3>
                    <button className="btn-icon" onClick={onClose}><X size={18} strokeWidth={1.5} /></button>
                </div>
                <div className="edit-modal-body">
                    {children}
                </div>
                <div className="edit-modal-footer">
                    <Button className="btn btn-ghost" onClick={onClose}>Cancelar</Button>
                    <Button className="btn btn-primary" onClick={onSave}>Salvar</Button>
                </div>
            </div>
        </div>
    );
}
