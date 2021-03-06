// User service UUID: Change this to your generated service UUID
const USER_SERVICE_UUID         = '91E4E176-D0B9-464D-9FE4-52EE3E9F1552'; 



// User service characteristics
const ID0_CHARACTERISTIC_UUID   = '00000000-0000-0000-0000-000000000000';
const ID1_CHARACTERISTIC_UUID   = '01000000-0000-0000-0000-000000000000';
//const ID1_CHARACTERISTIC_UUID   = 'E9062E71-9E62-4BC6-B0D3-35CDCD9B027B';



// PSDI Service UUID: Fixed value for Developer Trial
const PSDI_SERVICE_UUID         = 'E625601E-9E55-4597-A598-76018a0d293d'; // Device ID
const PSDI_CHARACTERISTIC_UUID  = '26E2B12B-85F0-4F3F-9FDD-91D114270E6E';






// -------------- //
// On window load //
// -------------- //

window.onload = () => {
    initializeApp();
};





// ----------------- //
// Handler functions //
// ----------------- //

function handlerButtonClickReg() {
    liffSendIdToDevice();
}







// ------------ //
// UI functions //
// ------------ //

function uiToggleRegistrationButton(state) {
    const el = document.getElementById("btn-reg-toggle");
    el.innerText = state ? "登録完了　IDを送信しました" : "登録";
    
    if (state) {
      el.classList.add("led-on");
    } else {
      el.classList.remove("led-on");
    }
}













function uiToggleDeviceConnected(connected) {
    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    elStatus.classList.remove("error");

    if (connected) {
        // Hide loading animation
        uiToggleLoadingAnimation(false);
        // Show status connected
        elStatus.classList.remove("inactive");
        elStatus.classList.add("success");
        elStatus.innerText = "Device connected";
        // Show controls
        elControls.classList.remove("hidden");
    } else {
        // Show loading animation
        uiToggleLoadingAnimation(true);
        // Show status disconnected
        elStatus.classList.remove("success");
        elStatus.classList.add("inactive");
        elStatus.innerText = "Device disconnected";
        // Hide controls
        elControls.classList.add("hidden");
    }
}





function uiToggleLoadingAnimation(isLoading) {
    const elLoading = document.getElementById("loading-animation");

    if (isLoading) {
        // Show loading animation
        elLoading.classList.remove("hidden");
    } else {
        // Hide loading animation
        elLoading.classList.add("hidden");
    }
}





function uiStatusError(message, showLoadingAnimation) {
    uiToggleLoadingAnimation(showLoadingAnimation);

    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    // Show status error
    elStatus.classList.remove("success");
    elStatus.classList.remove("inactive");
    elStatus.classList.add("error");
    elStatus.innerText = message;

    // Hide controls
    elControls.classList.add("hidden");
}





function makeErrorMsg(errorObj) {
    return "Error\n" + errorObj.code + "\n" + errorObj.message;
}






// -------------- //
// LIFF functions //
// -------------- //

function initializeApp() {
    liff.init(() => initializeLiff(), error => uiStatusError('erroe01' + makeErrorMsg(error), false));
}




function initializeLiff() {
    liff.initPlugins(['bluetooth']).then(() => {
        liffCheckAvailablityAndDo(() => liffRequestDevice());
    }).catch(error => {
        uiStatusError('erroe02' + makeErrorMsg(error), false);
    });
}



function liffCheckAvailablityAndDo(callbackIfAvailable) {
    // Check Bluetooth availability
    liff.bluetooth.getAvailability().then(isAvailable => {
        if (isAvailable) {
            uiToggleDeviceConnected(false);
            callbackIfAvailable();
        } else {
            uiStatusError("Bluetooth not available", true);
            setTimeout(() => liffCheckAvailablityAndDo(callbackIfAvailable), 10000);
        }
    }).catch(error => {
        uiStatusError('erroe03' + makeErrorMsg(error), false);
    });;
}


function liffRequestDevice() {
    liff.bluetooth.requestDevice().then(device => {
        liffConnectToDevice(device);
    }).catch(error => {
        uiStatusError('erroe04' + makeErrorMsg(error), false);
    });
}

function liffConnectToDevice(device) {
    device.gatt.connect().then(() => {
        document.getElementById("device-name").innerText = device.name;
        document.getElementById("device-id").innerText = device.id;

        // Show status connected
        uiToggleDeviceConnected(true);

        // Get service
        device.gatt.getPrimaryService(USER_SERVICE_UUID).then(service => {
            liffGetUserService(service);
        }).catch(error => {
            uiStatusError('erroe05' + makeErrorMsg(error), false);
        });
        device.gatt.getPrimaryService(PSDI_SERVICE_UUID).then(service => {
            liffGetPSDIService(service);
        }).catch(error => {
            uiStatusError('erroe06' + makeErrorMsg(error), false);
        });

        // Device disconnect callback
        const disconnectCallback = () => {
            // Show status disconnected
            uiToggleDeviceConnected(false);

            // Remove disconnect callback
            device.removeEventListener('gattserverdisconnected', disconnectCallback);


            uiToggleRegistrationButton(false);
 
            // Try to reconnect
            initializeLiff();
        };

        device.addEventListener('gattserverdisconnected', disconnectCallback);
    }).catch(error => {
        uiStatusError('erroe07' + makeErrorMsg(error), false);
    });
}




function liffGetUserService(service) {
	service.getCharacteristic(ID0_CHARACTERISTIC_UUID).then(characteristic => {
        window.Id0Characteristic = characteristic;
    }).catch(error => {
        uiStatusError('erroe08' + makeErrorMsg(error), false);
    });
    
    service.getCharacteristic(ID1_CHARACTERISTIC_UUID).then(characteristic => {
        window.Id1Characteristic = characteristic;
    }).catch(error => {
        uiStatusError('erroe09' + makeErrorMsg(error), false);
    });
}




function liffGetPSDIService(service) {
    // Get PSDI value
    service.getCharacteristic(PSDI_CHARACTERISTIC_UUID).then(characteristic => {
        return characteristic.readValue();
    }).then(value => {
        // Byte array to hex string
        const psdi = new Uint8Array(value.buffer)
            .reduce((output, byte) => output + ("0" + byte.toString(16)).slice(-2), "");
        document.getElementById("device-psdi").innerText = psdi;
    }).catch(error => {
        uiStatusError('erroe10' + makeErrorMsg(error), false);
    });
}




function liffSendIdToDevice(){
	liff.getProfile().then(profile => {
		id = profile.userId;
    	uiToggleRegistrationButton(true);
		liffSendMesage(id);
		
		DispMessage(id);
	})
	.catch((err) => {
		console.log('error', err);
		DispMessage(err);
	});
}




function liffSendMesage(text) {
	var send_arry = new Uint8Array(20);
	text_array = (new TextEncoder).encode(text);
	
	for (  var i = 0;  i < 20;  i++  ) {
		send_arry[i] = 0;
	}
	for (  var i = 0;  i < 20 && i < text_array.length;  i++  ) {
		send_arry[i] = text_array[i];
	}
    window.Id0Characteristic.writeValue(send_arry
    ).catch(error => {
        uiStatusError('erroe11' + makeErrorMsg(error), false);
    });
    
	for (  var i = 0;  i < 20;  i++  ) {
		send_arry[i] = 0;
	}
	for (  var i = 0;  i < 20 && (i+20) < text_array.length;  i++  ) {
		send_arry[i] = text_array[i+20];
	}
    window.Id1Characteristic.writeValue(send_arry
    ).catch(error => {
        uiStatusError('erroe12' + makeErrorMsg(error), false);
    });
    
    
    
}



function liffSendMessage(message){
	liff.sendMessages([
	  {
	    type:'text',
	    text: message
	  }
	]);
}







function DispMessage(message){
    const el = document.getElementById("device-message");
    el.innerText = message;
}
