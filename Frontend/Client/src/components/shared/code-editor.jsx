import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from '@monaco-editor/react';
import socket from "@/lib/socket.js";

const DEFAULT_LANGUAGE = 'javascript'

export const CodeEditor = ({
    language,
    value,
    height = '90vh',
    onChange,
    onCursorChange,
    remoteCursors = {}
}) => {
    const monaco = useMonaco();
    const editorRef = useRef(null);
    const [decorations, setDecorations] = useState([]);

    const handleChange = (value) => {
        if(onChange) {
            onChange(value);
        }
    }
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        editor.onDidChangeCursorPosition((e) => {
            if (onCursorChange) {
                onCursorChange({
                    position: e.position,
                    selection: editor.getSelection()
                });
            }
        });
        editor.onDidChangeCursorSelection((e) => {
            if (onCursorChange) {
                onCursorChange({
                    position: e.position,
                    selection: e.selection
                });
            }
        });
    }
    // Update remote cursors
    useEffect(() => {
        if (!editorRef.current || !monaco) return;

        // Clear previous decorations
        if (decorations.length > 0) {
            editorRef.current.deltaDecorations(decorations, []);
        }

        const newDecorations = Object.entries(remoteCursors).map(([userId, cursorData]) => {
            if (cursorData.position && cursorData.username && userId !== socket.id) {
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
                const colorIndex = Math.abs(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
                const color = colors[colorIndex];
                
                return {
                    range: new monaco.Range(
                        cursorData.position.lineNumber,
                        cursorData.position.column,
                        cursorData.position.lineNumber,
                        cursorData.position.column + 1
                    ),
                    options: {
                        className: `remote-cursor`,
                        inlineStyle: {
                            borderLeft: `2px solid ${color}`,
                            background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.3)`,
                            marginLeft: '-1px'
                        },
                        hoverMessage: { value: `👤 ${cursorData.username}` }
                    }
                };
            }
            return null;
        }).filter(Boolean);

        if (newDecorations.length > 0) {
            const newDecorationIds = editorRef.current.deltaDecorations([], newDecorations);
            setDecorations(newDecorationIds);
        }
    }, [remoteCursors, monaco]);

    useEffect(() => {
        if (monaco && language && editorRef.current) {
            const model = editorRef.current.getModel();
            if (model && model.getLanguageId() !== language) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [monaco, language]);
    
    return (
        <Editor 
            theme='vs-dark'
            height={height}
            language={language ?? DEFAULT_LANGUAGE}
            onChange={handleChange}
            value={value || ''}
            onMount={handleEditorDidMount}
        />
    )
}
