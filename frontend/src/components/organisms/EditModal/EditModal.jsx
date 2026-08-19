import { X } from 'lucide-react';
import Button from '../../atoms/Button/Button';
import { useLanguage } from '../../../contexts/LanguageContext';
import './EditModal.css';

export default function EditModal({ title, isOpen, onClose, onSave, children }) {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal-content u-fade-in" onClick={e => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h3>{title}</h3>
                    <button className="c-btn--icon" onClick={onClose}><X size={18} strokeWidth={1.5} /></button>
                </div>
                <div className="edit-modal-body">
                    {children}
                </div>
                <div className="edit-modal-footer">
                    <Button className="c-btn c-btn--ghost" onClick={onClose}>{t("Cancelar")}</Button>
                    <Button className="c-btn c-btn--primary" onClick={onSave}>{t("Salvar")}</Button>
                </div>
            </div>
        </div>
    );
}
