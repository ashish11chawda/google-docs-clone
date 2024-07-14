import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { useParams } from "react-router";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
];

export default function TextEditor() {
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const {id} = useParams();
    const documentId = id;
    console.log("docunmentId: ", id);

    useEffect(() => {
        const socketObj = io("http://localhost:3001");
        setSocket(socketObj);
        return () => {
            socketObj.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta, oldDelta, source) => {
            if (source != "user") return;
            socket.emit("send-changes", delta);
        };

        quill.on("text-change", handler);

        return () => {
            quill.off("text-change", handler);
        };
    }, [socket, quill]);

    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta) => {
            quill.updateContents(delta);
        };

        socket.on('receive-changes', handler);

        return () => {
            socket.off("receive-changes", handler);
        };
    }, [socket, quill]);

    useEffect(() => {
        if(socket == null || quill == null ) return;

        socket.once('load-document', document => {
            quill.setContents(document);
            quill.enable();
        })

        socket.emit('get-document', documentId); 

    }, [socket, quill, documentId])

    useEffect(() => {
        if (socket == null || quill == null) return;

        const interval = setInterval(() => {
            console.log(quill.getContents());
            socket.emit('save-document', quill.getContents());
        }, SAVE_INTERVAL_MS)

        return () => {
            clearInterval(interval);
        }
    }, [socket, quill]);

    const wrapperRef = useCallback((wrapper) => {
        if (wrapper == null) return;
        wrapper.innerHTML = "";
        const editor = document.createElement("div");
        wrapper.append(editor);
        const quillObj = new Quill(editor, {
            theme: "snow",
            modules: { toolbar: TOOLBAR_OPTIONS },
        });
        quillObj.disable();
        quillObj.setText("Loading.....")
        setQuill(quillObj);
        return () => {
            wrapperRef.innerHTML = "";
        };
    }, []);

    return (
        <div id="container" className="container" ref={wrapperRef}>
            TextEditor
        </div>
    );
}
