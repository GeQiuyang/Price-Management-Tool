import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

let activeModalCount = 0;

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
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);
    const closeTimerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            closeTimerRef.current = window.setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 420);
        }

        return () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
            }
        };
    }, [isOpen, shouldRender]);

    useEffect(() => {
        if (shouldRender) {
            activeModalCount += 1;

            if (activeModalCount === 1) {
                const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
                document.body.dataset.modalLock = 'true';
                document.body.style.overflow = 'hidden';

                if (scrollbarWidth > 0) {
                    document.body.style.paddingRight = `${scrollbarWidth}px`;
                }
            }

            return () => {
                activeModalCount = Math.max(0, activeModalCount - 1);

                if (activeModalCount === 0) {
                    delete document.body.dataset.modalLock;
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }
            };
        }

        return undefined;
    }, [shouldRender]);

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`sf-modal-overlay${noOverlay ? ' sf-modal-no-overlay' : ''}${isClosing ? ' sf-modal-overlay-closing' : ''}`}
            onClick={onClose}
        >
            <div
                className={`sf-modal-container ${className}${isClosing ? ' sf-modal-container-closing' : ''}`}
                style={{ width }}
                onClick={e => e.stopPropagation()}
            >
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
