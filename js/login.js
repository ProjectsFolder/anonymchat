async function createChat(value) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/create/"+value, {method: "POST"});
    let json = await responJson.json();
    return json;
}

async function checkExistChat(key) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/exists/"+key, {method: "GET"});
    let json = await responJson.json();
    return json;
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

let LoginStatusEnum = {
        CREATE_ROOM: 0,
        CHECK_LOGIN_ROOM: 1,
        LOGIN_SUCCESS: 2
    }

window.onload = function () {
    let loginStatus = LoginStatusEnum.CREATE_ROOM;

    let url = new URL(window.location.href);
    let key = url.searchParams.get("key");

    let loginChatForm = document.getElementsByName("loginChat")[0];


    function checkExistChatSuccess(responJson) {
        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = false;
        
        loginChatForm.nextButton.disabled = true;
        
        sessionStorage.setItem('key', responJson.key);
        sessionStorage.setItem('chatname', responJson.name);

        loginStatus = LoginStatusEnum.CHECK_LOGIN_ROOM;
    }

    function loginChatSuccess(responJson) {
        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = true;
        loginChatForm.roomLink.disabled = false;

        if(key==null) {
            key = sessionStorage.getItem('key');
            loginChatForm.roomLink.value = url+"?key="+key;
        } else {
            loginChatForm.roomLink.value = url;
        }

        sessionStorage.setItem('username', responJson.username);
        sessionStorage.setItem('token', responJson.token);
        sessionStorage.setItem('chatlink', loginChatForm.roomLink.value);

        loginStatus = LoginStatusEnum.LOGIN_SUCCESS;
    }

    if (key != null) {
        checkExistChat(key)
            .then(result => {
                checkExistChatSuccess(result);
                loginChatForm.roomName.value = result.name;
            });
    }
    loginChatForm.onsubmit = function () {
        switch (loginStatus) {
            case LoginStatusEnum.CREATE_ROOM: {

                createChat(loginChatForm.roomName.value)
                    .then(result => {
                        checkExistChatSuccess(result);
                    });

                break;
            }
            case LoginStatusEnum.CHECK_LOGIN_ROOM: {
                let data = new FormData();
                data.append("name", loginChatForm.userName.value);
    
                loginChat(sessionStorage.getItem("key"), data)
                    .then(result => {
                        loginChatSuccess(result);

                        loginStatus = LoginStatusEnum.LOGIN_SUCCESS;
                    }, reject => {
                        alert(reject);   
                    });

                break;
            }
            case LoginStatusEnum.LOGIN_SUCCESS: {
                window.location.replace("index.html");
                break;
            }
        }

        return false;
    }


    // ВАЛИДАЦИЯ
    loginChatForm.roomName.oninput = function () {
        if ( loginChatForm.roomName.value.length < 3 || loginChatForm.roomName.value.length > 50 )  {
            loginChatForm.nextButton.disabled = true;
        } else {
            loginChatForm.nextButton.disabled = false;
        }
    }
    loginChatForm.userName.oninput = function () {
        if (loginChatForm.userName.value.length < 3 || loginChatForm.userName.value.length > 50) {
            loginChatForm.nextButton.disabled = true;
        } else {
            loginChatForm.nextButton.disabled = false;
        }
    }

}