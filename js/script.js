// Autor: Carlos Cavalheiro
// Data: 24/10/2023

var endPoint = "https://api.openai.com/v1/chat/completions";
var APIKey = $secrets.OPENAI_BRANDAO_API_KEY; //OPENAI_BRANDAO_API_KEY | OPENAI_API_KEY
var APIAzure = $secrets.AZURE_API_KEY;

var dvResultado = document.getElementById("dv-resposta");
var botaoBusca = document.querySelector("#bt-busca");
var txtBusca = document.getElementById("txt-busca");

dvResultado.style.display = "none";

window.onload = function() {
    converteTextoAudioAzure("Olá, sou R 2 D 3005 o assistente virtual do SENAI. Diga r 2 e pergunte algo.")
    reconhecerVoz();

    txtBusca.addEventListener('keypress', (event) => {
        if(event.key == 'Enter')
            realizarConsulta();
    });   
    
    // Verificar o modo atual
    if (localStorage.getItem("mode") === "dark") {
        document.body.classList.add("dark-mode");
    }
}


// Função para alternar o modo
function toggleMode() {
    var body = document.body;
    
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        localStorage.setItem("mode", "light");
    } else {
        body.classList.add("dark-mode");
        localStorage.setItem("mode", "dark");
    }
}

async function realizarConsulta() {

    var meuCabecalho = new Headers();
    meuCabecalho.append("Content-Type", "application/json");
    meuCabecalho.append("Authorization", `"Bearer " + ${APIKey}"`);

    dvResultado.style.display = "block";
    dvResultado.innerHTML = '<div class="d-flex justify-content-center"><span class="spinner-border text-warning spinner-border-sm" role="status" aria-hidden="true"></span> Carregando...</div>';

    const msgFinal = "Se desejar realizar outra consulta estou por aqui.";

    var corpo = JSON.stringify({
        //"model": "gpt-3.5-turbo",
        "model" : "ft:gpt-3.5-turbo-0613:zeros-e-um::8DDHyrh4",
        "messages": [
                {
                "role": "system",
                "content": "Resposta utilizando uma linguagem simpática de um personagem estilo jedi Yoda"
                },
                {
                "role": "user",
                "content": `"${txtBusca.value} + ${msgFinal}"`
                }
            ],
        "temperature": 0.7
    });

    var requestOptions = {
        method: 'POST',
        headers: meuCabecalho,
        body: corpo,
        redirect: 'follow'
    }

    try {
        var response = await fetch(endPoint, requestOptions)
                
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        var data = await response.json();

        console.log(data.choices[0].message.content);
        dvResultado.innerText = data.choices[0].message.content;
        dvResultado.innerHTML += `<br><br><button type="button" class="btn btn-secondary rounded-circle" onclick="paraOuvir()" id="bt-play"><i class="bi bi-pause-fill"></i> Pause</button>`;

        converteTextoAudioAzure(data.choices[0].message.content);

    } catch (error) {
        console.error("Deu RUIM: " + error);
    }
}

function reconhecerVoz(){
    
    // Cria um objeto de reconhecimento de fala
    const recognition = new webkitSpeechRecognition();
  
    // Configura o objeto de reconhecimento de fala
    recognition.lang = 'pt-BR';
    //recognition.lang = window.navigator.language;
    recognition.continuous = true;
    recognition.interimResults = true;

    // Obtém o texto reconhecido do arquivo de áudio
    //const text = recognition.transcribe('audio.mp3');
   
    botaoBusca.addEventListener('mousedown', () => {
        console.log("Botão pressionado");
        // Inicia o reconhecimento de fala
        recognition.start();

    });
    
    botaoBusca.addEventListener('mouseup', () => {
        console.log("Botão solto");
        // Interrompe o reconhecimento de fala
        recognition.stop();
        
        if (txtBusca.value != "")
            realizarConsulta();
    });

    // Escuta o resultado do reconhecimento de fala
    recognition.onresult = function(event) {
        // Obtém o texto reconhecido
        const text = event.results[0][0].transcript;

        // Faz algo com o texto reconhecido
        console.log(text);  
        
        txtBusca.value = text;
        detectarIntensao(text);
    };
}

function converteTextoAudioAzure(texto){

    var myHeaders = new Headers();
    myHeaders.append("Ocp-Apim-Subscription-Key", `"${APIAzure}"`);
    myHeaders.append("Content-Type", "application/ssml+xml");
    myHeaders.append("X-Microsoft-OutputFormat", "audio-16khz-128kbitrate-mono-mp3");
    myHeaders.append("User-Agent", "curl");

    var raw = `<speak version='1.0' xml:lang='pt-BR'>\r\n
                    <voice xml:lang='pt-BR' xml:gender='Male' name='pt-BR-JulioNeural'>${texto}</voice>\r\n
                </speak>`;
    

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1", requestOptions)
    .then(response => response.blob())
    .then(result => {
        var audio = document.getElementById("audio");
        audio.src = URL.createObjectURL(result);
        audio.play();
    })
}

function abrirNovaPagina() {
    window.open('https://lencoispaulista.sp.senai.br', '_blank');
}


function paraOuvir(){
    var audio = document.getElementById("audio");
    var btAudio = document.getElementById("bt-play");

    if(!audio.paused){
        audio.pause();
        btAudio.innerHTML = '<i class="bi bi-play-fill"></i> Play';
    }
    else{
        btAudio.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
        audio.play();
    }
}

// Crie uma instância de SpeechRecognition
const recognition = new webkitSpeechRecognition();

function AtivarR2() {

    // Defina configurações para a instância
    recognition.lang = "pt-BR"; // Defina o idioma para o reconhecimento de voz
    recognition.continuous = true; // Permite que ele continue escutando
    recognition.interimResults = false; // Define para true se quiser resultados parciais

    // Inicie o reconhecimento de voz
    recognition.start();

    // Adicione um evento de escuta para lidar com os resultados
    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]; // Último resultado

        // Verifique o texto reconhecido
        const recognizedText = result[0].transcript;

        // Verifique se a palavra "Jarvis" está no texto
        if (recognizedText.toLowerCase().includes('r2')) {

            // Comece a salvar a pergunta quando "Jarvis" é detectado
            let array_pergunta = recognizedText.toLowerCase().split('r2');

            array_pergunta = array_pergunta[array_pergunta.length - 1];

            console.log(array_pergunta.toLowerCase())

            if(array_pergunta.toLowerCase().includes("trocar tema")){
                console.log("Trocar tema");
                toggleMode();
                return;
            }

            if(array_pergunta.toLowerCase().includes("pausar audio") || array_pergunta.toLowerCase().includes("play áudio")){
                console.log("Pausar");
                paraOuvir();
                return;
            }

            if(array_pergunta.toLowerCase().includes("site do senai")){
                console.log("Abrir site");
                abrirNovaPagina();
                return;
            }
            
            txtBusca.value = array_pergunta.toLowerCase();
            
            if(txtBusca.value != "")
                realizarConsulta();


        }
        //Pare o reconhecimento de voz para economizar recursos
        recognition.stop();
    };

    // Adicione um evento para reiniciar o reconhecimento após um tempo
    recognition.onend = () => {
        setTimeout(() => {
            recognition.start();
        }, 1000); // Espere 1 segundo antes de reiniciar
    };
}

AtivarR2();