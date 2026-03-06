import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    headerRightContent,
    children,
    footer,
    onConfirm,
    onCancel,
    confirmText = '确认',
    cancelText = '取消',
    width = 520,
    className = '',
    noOverlay = false
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className={`sf-modal-overlay${noOverlay ? ' sf-modal-no-overlay' : ''}`} onClick={onClose}>
            <div className={`sf-modal-container ${className}`} style={{ width }} onClick={e => e.stopPropagation()}>
                {/* 关闭图标 */}
                <button className="sf-modal-close" onClick={onClose}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L13 13M1 13L13 1" stroke="#86909C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* 头部 */}
                <div className="sf-modal-header">
                    <div className="sf-modal-title">{title}</div>
                    {headerRightContent && <div className="sf-modal-header-right">{headerRightContent}</div>}
                </div>

                {/* 主体 - 包含表单和列表等 */}
                <div className="sf-modal-body">
                    {children}
                </div>

                {/* 底部操作区 */}
                {footer !== null && (
                    <div className="sf-modal-footer">
                        {footer ? footer : (
                            <>
                                <button className="sf-btn sf-btn-cancel" onClick={onCancel || onClose}>
                                    {cancelText}
                                </button>
                                <button className="sf-btn sf-btn-confirm" onClick={onConfirm}>
                                    {confirmText}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
