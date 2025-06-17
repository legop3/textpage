// import { getCookie } from "/src/utils.mjs";

const socket = io();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

Quill.register('modules/imageResize', window.ImageResize.default);
// Quill.register("modules/htmlEditButton", htmlEditButton);

// Quill.register('modules/blotFormatter', QuillBlotFormatter.default)

const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {

        //new blotformatter
        // blotFormatter: {

        // },

        //old imageresize
        imageResize: {
            modules: ['Resize', 'DisplaySize']
        },
        // htmlEditButton: {
        //     syntax: false
        // },



        // toolbar: [
        //     [{ header: [1, 2, false] }],
        //     ['bold', 'italic', 'underline'],
        //     ['link', 'code-block', 'image'],
        //     [{ color: [] }, { background: [] }],
        //     [{ list: 'ordered' }, { list: 'bullet' }],
        //     ['clean'],
        //     [{ 'font': []}],
        //     // [{ 'direction': 'rtl '}]
        //     [{'script': 'sub'}, {'script': 'super'}]
        // ]
        toolbar: '#quill-toolbar'
    }
});

var editcount 


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

socket.on('getYourPage', (callback) => {
    callback(0);
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

const incomingStatus = document.getElementById('incoming-status')
socket.on('deltaUpdate', (delta) => {
    // apply the delta to the quill editor
    // console.log(`Received delta: ${JSON.stringify(delta)}`);
    quill.updateContents(delta);
    incomingStatus.innerHTML = `${JSON.stringify(delta)}`
    // editcount++
    // document.title = `Textpage (${editcount} edits)`
});


// old one
// const syncStatus = document.getElementById('sync-status')
// socket.on('replaceDocument', async (deltaList,callback) => { //deltaList,callback,callback2
//     // console.log(`document load, ${deltaList.deltas}`)
//     const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

//     syncStatus.innerHTML = `Syncing ${deltaList.deltas.length} changes`
//     syncStatus.classList.remove('bg-red-500')
//     syncStatus.classList.add('bg-yellow-500')

//     await delay(100)

//     for (let delta of deltaList.deltas) {
//         // console.log(delta)
//         quill.updateContents(delta)
//         // await delay(1)
//     }

//     syncStatus.innerHTML='Init synced!'
//     syncStatus.classList.remove('bg-yellow-500')
//     syncStatus.classList.add('bg-blue-300')

//     callback()
// })


//new sync init thing. more complicated but much much faster
const syncStatus = document.getElementById('sync-status');
socket.on('replaceDocument', async (deltaList, callback) => {
    syncStatus.innerHTML = `Syncing ${deltaList.deltas.length} changes`;
    editcount = deltaList.deltas.length
    syncStatus.classList.replace('bg-red-500', 'bg-yellow-500');
    document.title = `Textpage (${editcount})`

    // use quill's delta thing to combine all deltas into one
    const Delta = Quill.import('delta');

    await delay(700)
    // compose a whole page from quill deltas
    // Marple if you see this, i think you may be able to do this same thing server-side by ->
    // installing quill using npm, then doing the same deltas thing that i did here.
    // it doesn't seem like it needs a DOM rendered or whatever to do this... but idk
    const combined = deltaList.deltas.reduce((acc, d) => acc.compose(d), new Delta());

    quill.setContents(combined); // faster than updateContents in loop

    // ensure that the UI doesn't freak out when setting contents (cause it was)
    requestAnimationFrame(() => {
        syncStatus.innerHTML = 'Synced!';
        syncStatus.classList.replace('bg-yellow-500', 'bg-blue-300');
    });

    callback();
});


const connectedStatus = document.getElementById('connected-status')
socket.on('connect', () => {
    connectedStatus.innerHTML = 'Connected'
    connectedStatus.classList.replace('bg-red-500', 'bg-green-500')
})

socket.on('disconnect', () => {
    connectedStatus.innerHTML = 'Disconnected'
    connectedStatus.classList.replace('bg-green-500', 'bg-red-500')
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
    // console.log(`delta: ${JSON.stringify(delta)}`)
    // console.log(`oldDelta: ${JSON.stringify(oldDelta)}`)
    // console.log(`source: ${JSON.stringify(source)}`)


    if (source === 'user') {
        // send the delta to the server
        socket.emit('deltaUpdateSend', delta);
    }
    // editcount++
    // document.title = `Textpage (${editcount} edits)`

    // socket.emit()
})

// run when selection is changed (when cursor is moved)
quill.on('selection-change', (range, oldRange, source) => {
    // console.log(`range: ${JSON.stringify(range)}`)
    // console.log(`oldRange: ${JSON.stringify(oldRange)}`)
    // console.log(`source: ${JSON.stringify(source)}`)

    if (source === 'user' && range) {
        // send the selection to the server
        socket.emit('selection', range);
    }

})