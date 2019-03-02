async function createOrExistChat(route, value, method) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/"+route+"/"+value, {method: method});
    if (responJson.ok) {
        let json = await responJson.json();
        return json;
    } else {
        throw new Error(responJson.status +  ": " + responJson.statusText);
    }
}

async function loginChat(key, data) {
    let responJson = await fetch(SettingController.getUrl()+"api/user/login/"+key, {method: "POST", body: data});
    
    if (responJson.ok) {
        let json = await responJson.json();
        return json;
    } else {
        throw new Error(responJson.status +  ": " + responJson.statusText);
    }
}

class LoginChatForm {
    constructor(formDOMElem) {
        this.formDOMElem = formDOMElem;
        this.state1 = new InputRoomState(this);
        this.state2 = new InputUserState(this);
        this.state3 = new InputLinkState(this);

        this.roomname = "";
        this.username = "";
        this.roomlink = "";

        this._setInputAccessibility = function (state){
            this.formDOMElem.roomName.disabled = true;
            this.formDOMElem.userName.disabled = true;
            this.formDOMElem.roomLink.disabled = true;

            state.inputObject.disabled = false;
            state.inputObject.focus();
        }

        this.currentState = this.state1;
        this._setInputAccessibility(this.state1);
    }

    setState(state){
        this.currentState = state;
        this._setInputAccessibility(state);
    }
    getState() {
        return this.currentState.nameState;
    }
    inputRoom(route, value, method) {
        this.currentState.inputRoom(route, value, method);
    }
    inputUsername(url, key) {
        this.currentState.inputUser(url, key);
    }
    inputLink() {
        this.currentState.inputLink();
    }
    startChat() {
        window.location.replace("index.html");
    }
}

class ChatStateBase{
	constructor(chat){
        this.chat = chat;
	}
	inputRoom(){
		throw new Exception();
	}
	inputUser(){
		throw new Exception();
	}
	inputLink(){
		throw new Exception();
	}
}

/**
 * Состояние ввода комнаты
 */
class InputRoomState extends ChatStateBase{
    constructor(chat){
        super(chat);
        this.nameState = "inputRoomState";
        this.inputObject = this.chat.formDOMElem.roomName;

        this._checkExistChatSuccess = function(responJson) {
            this.chat.formDOMElem.roomName.value = responJson.name;
            this.chat.formDOMElem.nextButton.disabled = true;
    
            sessionStorage.setItem('key', responJson.key);
            sessionStorage.setItem('chatname', responJson.name);
        }
	}
	inputRoom(route, value, method){
        let loginChatForm = this.chat.formDOMElem;
        let newRoomName = loginChatForm.roomName.value;

        this.chat.roomname = newRoomName;

        if (value === undefined) {
            value = newRoomName;
        }
        createOrExistChat(route, value, method)
                    .then(result => {
                        this._checkExistChatSuccess(result);
                        this.chat.setState(this.chat.state2);
                    });
    }
}

/**
 * Состояние ввода пользователя
 */
class InputUserState extends ChatStateBase{
    constructor(chat){
        super(chat);
        this.nameState = "inputUserState";
        this.inputObject = this.chat.formDOMElem.userName;

        this._loginChatSuccess = function (responJson, url, key){
            if(key==null) {
                key = sessionStorage.getItem('key');
                this.chat.formDOMElem.roomLink.value = url+"?key="+key;
            } else {
                this.chat.formDOMElem.roomLink.value = url;
            }
            
            sessionStorage.setItem('username', responJson.username);
            sessionStorage.setItem('token', responJson.token);
            sessionStorage.setItem('chatlink', this.chat.formDOMElem.roomLink.value);
        }
    }
	inputUser(url, key){
        let loginChatForm = this.chat.formDOMElem;
        let newUsername = loginChatForm.userName.value;
  
        this.chat.username = newUsername;

        let data = new FormData();
        data.append("name", newUsername);
        loginChat(sessionStorage.getItem("key"), data)
            .then(result => {
                this._loginChatSuccess(result, url, key);
                this.chat.setState(this.chat.state3);

            }, reject => {
                alert(reject);   
            });
	}
}

/**
 * Состояние ввода ссылки
 */
class InputLinkState extends ChatStateBase{
    constructor(chat){
        super(chat);
        this.nameState = "inputLinkState";
        this.inputObject = this.chat.formDOMElem.roomLink;

    }
    
	inputLink(){
        let loginChatForm = document.getElementsByName("loginChat")[0];
        let newLinkChat = loginChatForm.roomLink.value;
        this.chat.roomlink = newLinkChat;
        
        this.chat.startChat();
	}
}


function getLinkComponents() {
    let url = new URL(window.location.href);
    let key = url.searchParams.get("key");

    return {
        key,
        url
    };
}

function createChatFormObject(formDOM, linkComp) {
    loginChatForm = new LoginChatForm(formDOM);
    let chatFormDOM = loginChatForm.formDOMElem;

    chatFormSubmitListener(chatFormDOM, linkComp);
    chatFormInputListener(chatFormDOM);
}

function chatFormSubmitListener(chatFormDOM, {key, url}) {
    if (key) {
        loginChatForm.inputRoom("exists",key,"GET");
    }
    chatFormDOM.onsubmit = function () {
        switch (loginChatForm.getState()) {
            case "inputRoomState": {
                loginChatForm.inputRoom("create",undefined,"POST");
                break;
            }
            case "inputUserState": {
                loginChatForm.inputUsername(url, key);
                break;
            }
            case "inputLinkState": {
                loginChatForm.inputLink();
                break;
            }
        }
        return false;
    }
}

function chatFormInputListener(chatFormDOM) {
    chatFormDOM.roomName.oninput = 
    chatFormDOM.userName.oninput = function (event) {
        let target = event.target;
        if ( target.value.length < 3 || target.value.length > 50 )  {
            chatFormDOM.nextButton.disabled = true;
        } else {
            chatFormDOM.nextButton.disabled = false;
        }
    }
}

window.onload = function () {
    let linkComp  = getLinkComponents();
    let loginformDOMElem = document.getElementsByName("loginChat")[0];
    createChatFormObject(loginformDOMElem, linkComp);
}