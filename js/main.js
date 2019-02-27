window.onload = function () {
    
    // let sessionData = loadSessionData();
    // loadUserData(sessionData.login, sessionData.userid);
    let stateTab = {
        isTabLeave: false,
        newMessageCount: 0,
        logOut: false
    };
    logOutListener(sessionData.token, stateTab);
    windowBlurFocusListener(stateTab);
    getAllMessage(sessionData, stateTab);
    sendMessageListener(sessionData);
    let formDOMAvatar = document.getElementsByName("avatarFile")[0];
    let avatarModalWindow = new ModalWindow(formDOMAvatar, sessionData);
    avatarChangeButtonListener(avatarModalWindow);

 }


class Message {
    constructor(options) {
        this._elem;

        this.nickname = options.nickname;
        this.text = options.text;
        this.imgSrc = options.imgSrc;
        this.time = options.time;
        this.nicknameFromToken = options.nicknameFromToken;
        this.id = options.id;
    }
    render() {
        
        let allElements =  createAllElements(this._elem);
        allElements = setAllProperties(allElements, this);
        allElements = appendAllChild(allElements);

        this._elem = allElements.elem;

        function createAllElements(elem) {
            return {
                elem: document.createElement("article"),
                headerMessage: document.createElement("header"),
                avatarWrap: document.createElement("div"),
                avatarImg: document.createElement("img"),
                aboutInfo: document.createElement("div"),
                nickname: document.createElement("div"),
                dateTime: document.createElement("div"),
                time: document.createElement("time"),
                date: document.createElement("time"),
                textMessage: document.createElement("div")
            }
        }
        
        function setAllProperties(allElements, self) {
            allElements.elem.className = "message depth-effect";
            let messageType = getMessageType(self);
            allElements.elem.classList.add(messageType);
            
            allElements.headerMessage.className = "header-message";
            allElements.avatarWrap.className = "avatar-wrap";
            allElements.avatarImg.className = "avatar-img";
            allElements.avatarImg.height = 40;
            allElements.avatarImg.width = 40;
            allElements.avatarImg.src = self.imgSrc;
    
            allElements.aboutInfo.className = "about-info";
            allElements.nickname.className = "nickname";
            allElements.nickname.textContent = self.nickname;
            allElements.dateTime.className = "date-time";

            let dateObj = new Date(self.time*1000);
            allElements.time.className = "time";
            allElements.time.textContent = `${formatDateTime(dateObj.getHours())}:${formatDateTime(dateObj.getMinutes())}`;
            allElements.date.className = "date";
            allElements.date.textContent = `${formatDateTime(dateObj.getDate()+1)}.${formatDateTime(dateObj.getMonth())}.${formatDateTime(dateObj.getFullYear())}`;
            allElements.textMessage.className = "text";
            allElements.textMessage.textContent = self.text;

            return allElements;
        }

        function appendAllChild(allElements) {
            allElements.elem.appendChild(allElements.headerMessage);
            allElements.headerMessage.appendChild(allElements.avatarWrap);
            allElements.avatarWrap.appendChild(allElements.avatarImg);
            allElements.headerMessage.appendChild(allElements.aboutInfo);
            allElements.aboutInfo.appendChild(allElements.nickname);
            allElements.aboutInfo.appendChild(allElements.dateTime);
            allElements.dateTime.appendChild(allElements.time);
            allElements.dateTime.appendChild(allElements.date);
            allElements.elem.appendChild(allElements.textMessage);

            return allElements;
        }

        function getMessageType(self) {
            return (self.nicknameFromToken ===  self.nickname) ? "sent" : "accept";
        }
        function formatDateTime(value) {
            return ('0' + value).slice(-2);
        }
    }
    getElem() {
        if (!this._elem) this.render();
        return this._elem;
    }
    setSrc(src) {
        this.imgSrc = src;
        this._elem.querySelector(".avatar-img").src = this.imgSrc;
    }
}

class SmoothAnimation {
    constructor(options) {
        this._options = options; 

        if (this._options.isEsaeOut) {
            this._options.timing = makeEaseOut(this._options.timing);
        }

        function makeEaseOut(timing) {
            return function(timeFraction) {
                return 1 - timing(1 - timeFraction);
            }
        }
    }
    animate(draw) {
        var start = performance.now();
        let self = this;
        requestAnimationFrame(function animate(time) {
            var timeFraction = (time - start) / self._options.duration;
            if (timeFraction > 1) timeFraction = 1;
        
            var progress = self._options.timing(timeFraction)
            draw(progress);
            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            }
        });
    }
}

class ModalWindow {
    constructor(elem, sessionData) {
        let modalWindow = document.querySelector(".modal-window");
        let previewAvatar = document.querySelector(".upload-image");

        let self = this;

        this.setImage = function (target) {
            target.onchange = function() {
                let reader  = new FileReader();
                reader.readAsDataURL(elem.image.files[0]);
                reader.addEventListener("load" ,function () {
                    previewAvatar.src = reader.result;
                });
            }
        }
        this.uploadImage = function () {
            let formData = new FormData(elem);
            var xhr = new XMLHttpRequest();
            xhr.open("PUT", SettingController.getUrl()+"api/users/image", true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        loadUserData(sessionData.login, sessionData.userid);
                    }
                }
            }
            xhr.setRequestHeader("Authorization", sessionData.token);
            xhr.send(formData);
        }
        this.closeModalWindow = function () {
            modalWindow.style.display = "none";
        }
        this.openModalWindow = function () {
            modalWindow.style.display = "block";
        }

        elem.onclick = function(event) {
            let target = event.target;
            let action = target.getAttribute('data-action');
            if (action) {
              self[action](target);
            }
        }
        elem.onsubmit = function () {
            return false;
        }
    }
}

function sendMEssageToServer(messageText, sessionData){
    let formData = new FormData();
    formData.append("text", messageText.value);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", SettingController.getUrl()+"api/messages", true);
    xhr.setRequestHeader("Authorization", sessionData.token);
    xhr.send(formData);

    messageText.value = "";
}

function showMissedMessage(state){
    state.newMessageCount++;
    if (state.isTabLeave) {
        document.title = `easychat (${state.newMessageCount} сообщений)`;
    } else {
        document.title = `easychat`;
        state.newMessageCount = 0;
    }
}

function getNewMessage(sessionData, {messageList, lastMessageTime, urls}, state) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", SettingController.getUrl()+"api/messages?begin="+lastMessageTime, true);
    xhr.setRequestHeader("Authorization", sessionData.token);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200)
            {
                try{
                    function circ(timeFraction) {
                        return 1 - Math.sin(Math.acos(timeFraction))
                    }
                    let smoothAnim = new SmoothAnimation({
                        duration: 300,
                        timing: circ,
                        isEsaeOut: true
                    })

                    let respObj = JSON.parse(xhr.responseText);

                    respObj.forEach(item => {
                        let message = new Message({
                            nickname: item.username,
                            text: item.text,
                            time: item.timecreated ,
                            nicknameFromToken: sessionStorage.getItem("login"),
                            id: item.userid
                        });

                        lastMessageTime = message.time;

                        messageList.appendChild(message.getElem());

                        let from = messageList.scrollTop; 
                        let to = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
                        smoothAnim.animate(function(progress) {
                                progress = isNaN(progress) ? 0 : progress;
                                messageList.scrollTop = from + to * progress ;
                            });

                        showMissedMessage(state);
                        
                        for (let j=0; j<urls.length; j++) {
                            if (message.id == urls[j].id) {
                                message.setSrc(urls[j].url)
                            }
                        }
                        if (message.imgSrc == undefined) {
                            getImage(message.id)
                                .then( result => {
                                    urls.push({
                                        id: message.id,
                                        url:result.url
                                    });
                                    message.setSrc( result.url);
                                    console.dir(urls);
                                });
                        }
                    });
                } catch (e) {
                    if (e.name !== "TypeError")
                        alert(e);
                }
            } else {
                if (state.islogOut == true) {
                    xhr.abort();
                    return;
                } else {
                    alert(`Возникла ошибка: ${xhr.status}`);
                }
            }
            getNewMessage(sessionData, {messageList, lastMessageTime, urls}, state);
        }
    }
    xhr.send();
}

function getAllMessage(sessionData, state) {
    let messageList = document.querySelector(".message-list");
    let lastMessageTime;
    let urls;

    let userIdSet = new Set();
    let messageCollection = [];

    var xhr = new XMLHttpRequest();
    xhr.open("GET", SettingController.getUrl()+"api/messages?limit="+SettingController.getNumberLimitMessage(), true);
    xhr.setRequestHeader("Authorization", sessionData.token);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200)
            {
                let respObj = JSON.parse(xhr.responseText);
             
                respObj.forEach(item => {
                    let message = new Message({
                        nickname: item.username,
                        text: item.text,
                        time: item.timecreated ,
                        nicknameFromToken: sessionStorage.getItem("login"),
                        id: item.userid
                    });

                    lastMessageTime = message.time;
                    messageCollection.push(message);
                    userIdSet.add(message.id);
                });

                urls = Array.from(userIdSet);

                Promise.all(urls.map(getImage))
                    .then( result => {

                        for (let i=0; i<messageCollection.length; i++) {

                            for (let j=0; j<result.length; j++) {

                                if (messageCollection[i].id == result[j].id) {

                                    messageList.appendChild(messageCollection[i].getElem());
                                    messageCollection[i].setSrc(result[j].url)
                                    
                                    messageList.scrollTop  = messageList.scrollHeight;
                                }
                            }
                        }

                        urls = result;
                        getNewMessage(sessionData, {messageList, lastMessageTime, urls}, state);
                    });
            }
        }
    }
    xhr.send();
}

function getImage(userID) {
    return new Promise( function (res,rej) {

        let xhr = new XMLHttpRequest();
        xhr.open("GET",SettingController.getUrl()+"api/users/image/"+userID, true);
        xhr.responseType = "blob";
        xhr.setRequestHeader("Authorization", window.sessionStorage.getItem('token'));
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200)
                { 
                    var urlCreator = window.URL;
                    var imageUrl = urlCreator.createObjectURL(xhr.response);

                    res({
                        id: userID,
                        url: imageUrl
                    });
                } else {
                    res({
                        id: userID,
                        url: SettingController.getDefaultAvatar()
                    });
                }
            }
        }
        
        xhr.send();
    })
}

function loadSessionData() {
    let sessionToken = window.sessionStorage.getItem('token');
    if (sessionToken == null) {
        window.location = "login.html";
        return;
    }
    let sessionLogin = window.sessionStorage.getItem('login');
    let sessionUserID = window.sessionStorage.getItem('userid');

    return {
        token:  sessionToken,
        login:  sessionLogin,
        userid: sessionUserID
    }
}

function loadUserData(login, sessionUserID) {
    let profileName =  document.querySelector(".nav-item.profile");
    profileName.textContent = login;

    let avatarImg = document.querySelector(".message-input .avatar-img");
    getImage(sessionUserID)
        .then( result => { avatarImg.src = result.url; });
}

function logOutListener(token, state) {
    let logOut = document.querySelector(".nav-item.log-out");
    logOut.addEventListener("click", function() {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", SettingController.getUrl()+"api/users/logout", true);
        xhr.setRequestHeader("Authorization", token);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200)
                { 
                    state.islogOut = true;
                    window.sessionStorage.clear();
                    window.location.reload();
                }
            }
        }
        xhr.send();
    });
}

function windowBlurFocusListener(state) {
    window.addEventListener("blur", () => state.isTabLeave = "true");
    window.addEventListener("focus", () => {
            document.title = "easychat";
            state.newMessageCount = 0;
            state.isTabLeave = false;
        });
}

function sendMessageListener(sessionData) {
    let messageText = document.querySelector(".message-text");
    let sendMessage = document.querySelector(".send-message");

    messageText.addEventListener("keydown", (event) => {
        if (event.keyCode === 13) {
            sendMEssageToServer(messageText, sessionData);
        }
    });
    sendMessage.addEventListener("click",  (event) => sendMEssageToServer(messageText, sessionData) );
}

function avatarChangeButtonListener(modalWindow) {
    let profileButton = document.querySelector(".menu .profile");
    let avatarButton = document.querySelector(".chat-box .avatar-img");

    avatarButton.onclick = profileButton.onclick = () => modalWindow.openModalWindow();
}

