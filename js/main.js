window.onload = function () {
    
    let sessionData = loadSessionData();
    loadUserData(sessionData.username, sessionData.chatname);
    let stateTab = {
        isTabLeave: false,
        newMessageCount: 0,
        logOut: false
    };
    logOutListener(sessionData.token, stateTab);
    windowBlurFocusListener(stateTab);
    getAllMessage(sessionData, stateTab);
    sendMessageListener(sessionData);

 }

class Message {
    constructor(options) {
        this._elem;

        this.username = options.username;
        this.text = options.text;
        this.time = options.time;
        this.usernameFromToken = options.usernameFromToken;
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
     
            allElements.aboutInfo.className = "about-info";
            allElements.nickname.className = "nickname";
            allElements.nickname.textContent = self.username;
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
            allElements.headerMessage.appendChild(allElements.aboutInfo);
            allElements.aboutInfo.appendChild(allElements.nickname);
            allElements.aboutInfo.appendChild(allElements.dateTime);
            allElements.dateTime.appendChild(allElements.time);
            allElements.dateTime.appendChild(allElements.date);
            allElements.elem.appendChild(allElements.textMessage);

            return allElements;
        }

        function getMessageType(self) {
            return (self.usernameFromToken ===  self.username) ? "sent" : "accept";
        }
        function formatDateTime(value) {
            return ('0' + value).slice(-2);
        }
    }
    getElem() {
        if (!this._elem) this.render();
        return this._elem;
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

function sendMEssageToServer(messageText, sessionData){
    let formData = new FormData();
    formData.append("text", messageText.value);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", SettingController.getUrl()+"api/message/"+sessionData.key, true);
    xhr.setRequestHeader("X-AUTH-TOKEN", sessionData.token);
    xhr.send(formData);

    messageText.value = "";
}

function showMissedMessage(state){
    state.newMessageCount++;
    if (state.isTabLeave) {
        document.title = `anonymchat (${state.newMessageCount} сообщений)`;
    } else {
        document.title = `anonymchat`;
        state.newMessageCount = 0;
    }
}

function getNewMessage(sessionData, lastMessageTime, messageList, state) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", SettingController.getUrl()+"api/message/"+sessionData.key, true);
    xhr.setRequestHeader("X-AUTH-TOKEN", sessionData.token);
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
                    let lastItem = respObj[respObj.length-1];

                    if (lastMessageTime != lastItem.id) {
                        let message = new Message({
                            username: lastItem.author,
                            text: lastItem.text,
                            time: lastItem.timecreated ,
                            usernameFromToken: sessionData.username,
                        });

                        lastMessageTime = lastItem.id;

                        messageList.appendChild(message.getElem());

                        let from = messageList.scrollTop; 
                        let to = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
                        smoothAnim.animate(function(progress) {
                                progress = isNaN(progress) ? 0 : progress;
                                messageList.scrollTop = from + to * progress ;
                            });

                        showMissedMessage(state);
                    }
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
            getNewMessage(sessionData, lastMessageTime, messageList, state);
        }
    }
    xhr.send();
}

function getAllMessage(sessionData, state) {
    let messageList = document.querySelector(".message-list");
    let lastMessageTime;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", SettingController.getUrl()+"api/message/"+sessionData.key, true);
    xhr.setRequestHeader("X-AUTH-TOKEN", sessionData.token);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200)
            {
                let respObj = JSON.parse(xhr.responseText);

                respObj.forEach(item => {
                    let message = new Message({
                        username: item.author,
                        text: item.text,
                        time: item.timecreated ,
                        usernameFromToken: sessionStorage.getItem("username"),
                    });

                    lastMessageTime = item.id;

                    messageList.appendChild(message.getElem());
                    messageList.scrollTop  = messageList.scrollHeight;
                });

                getNewMessage(sessionData, lastMessageTime, messageList, state);
            }
        }
    }
    xhr.send();
}

function loadSessionData() {
    let sessionToken = window.sessionStorage.getItem('token');
    if (sessionToken == null) {
        window.location = "login.html";
        return;
    }
    let sessionKey = window.sessionStorage.getItem('key');
    let sessionUsername = window.sessionStorage.getItem('username');
    let sessionChatname = window.sessionStorage.getItem('chatname');

    return {
        token:  sessionToken,
        key:  sessionKey,
        username: sessionUsername,
        chatname: sessionChatname
    }
}

function loadUserData(username, chatname) {
    let profileName =  document.querySelector(".nav-item.profile");
    profileName.textContent = username;

    let tabItem =  document.querySelector(".tab-item");
    tabItem.textContent = chatname;
}

function logOutListener(token, state) {
    let logOut = document.querySelector(".nav-item.log-out");
    logOut.addEventListener("click", function() {
        state.islogOut = true;
        window.sessionStorage.clear();
        window.location.reload();
    });
}

function windowBlurFocusListener(state) {
    window.addEventListener("blur", () => state.isTabLeave = "true");
    window.addEventListener("focus", () => {
            document.title = "anonymchat";
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

