// import { getCookie } from "/src/utils.mjs";

const socket = io();

const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['link', 'code-block'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
        ]
    }
});

// var fulldocSend

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
  }
  
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  }

// on client init, sent from server on connection
socket.on('getCookie', (callback) => {

    var userUid = getCookie('userUid')
    console.log(`userUid cookie: ${userUid}`)
    if (!userUid) {
        console.log(`no userUid cookie, making one`)
        setCookie("userUid", crypto.randomUUID(), 365)
    }
    callback(userUid)
})

// socket.on('init', (fulldoc) => {
//     // get full document contents, apply them
//     quill.setContents(fulldoc);
// });

// socket.on('request-fulldoc', () => {
//     fulldocSend = quill.getContents()
//     socket.emit('fulldoc-fullfill', fulldocSend)
//     console.log(`sending fulldoc, ${fulldocSend}`)
// })

// socket.on('fulldoc-push', (fulldoc) => {
//     console.log('fulldoc recieved')
//     quill.setContents(fulldoc)
// })

socket.on('deltaUpdate', (delta) => {
    // apply the delta to the quill editor
    console.log(`Received delta: ${JSON.stringify(delta)}`);
    quill.updateContents(delta);
});

socket.on('replaceDocument', (deltaList) => {
    console.log(`document load, ${JSON.stringify(deltaList)}`)
})
// const Delta = Quill.import('delta');

// socket.on('update', (newDelta) => {
//   silent = true;

//   const current = quill.getContents();
//   const incoming = new Delta(newDelta);
//   const diff = current.diff(incoming);

//   if (diff.ops.length > 0) {
//     const selection = quill.getSelection();
//     quill.updateContents(diff);

//     if (selection) {
//       const length = quill.getLength();
//       const index = Math.min(selection.index, length - 1);
//       const selLength = Math.min(selection.length, length - index);
//       quill.setSelection(index, selLength);
//     }
//   }

//   silent = false;
// });

// run when text is changed in quill
quill.on('text-change', (delta, oldDelta, source) => {
    console.log(`delta: ${JSON.stringify(delta)}`)
    console.log(`oldDelta: ${JSON.stringify(oldDelta)}`)
    console.log(`source: ${JSON.stringify(source)}`)


    if (source === 'user') {
        // send the delta to the server
        socket.emit('deltaUpdateSend', delta);
    }

    // socket.emit()
})

// run when selection is changed (when cursor is moved)
quill.on('selection-change', (range, oldRange, source) => {
    console.log(`range: ${JSON.stringify(range)}`)
    console.log(`oldRange: ${JSON.stringify(oldRange)}`)
    console.log(`source: ${JSON.stringify(source)}`)

    if (source === 'user' && range) {
        // send the selection to the server
        socket.emit('selection', range);
    }

})