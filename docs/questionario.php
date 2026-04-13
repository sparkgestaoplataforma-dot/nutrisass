
text/x-generic Index.php ( PHP script, UTF-8 Unicode text )
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Index extends CI_Controller {

    public function __construct(){
        parent::__construct();

        $this->load->model('UsuariosModel', 'usuarios');
        $this->load->model('PacientesModel', 'pacientes');
        $this->load->model('QuestionarioModel', 'questionarios');

        // Traduções
        $this->form_validation->set_message('required','%s não pode ser vazio');
        $this->form_validation->set_message('valid_email','%s - O email inserido não é válido');
    }

    public function index()
    {

        $dados = array();

        $dados['ok'] = $this->session->flashdata('ok');
        $dados['erros'] = $this->session->flashdata('erros');

        //$this->load->view('questionario/fix/header-index', $dados);
        $this->load->view('questionario/index', $dados);
        //$this->load->view('questionario/fix/footer-index', $dados);
        //$this->render->view('index', $dados, 'secretaria');
    }

    public function ver($questionario_id)
    {

        $dados = array();

        $dados['ok'] = $this->session->flashdata('ok');
        $dados['erros'] = $this->session->flashdata('erros');

        $dados['questionario'] = $this->questionarios->getResultadoQuestionarioRespondido(array('id' => $questionario_id));

        $this->load->view('questionario/ver', $dados);

    }

    public function iniciar()
    {

        $dados = array();

        $dados['ok'] = $this->session->flashdata('ok');
        $dados['erros'] = $this->session->flashdata('erros');

        $paciente_id = trim( $this->input->post('paciente_id') );

        if( empty( $paciente_id ) ) {
            $this->session->set_flashdata('erros', 'Digite o código do paciente!');
            redirect("questionario/");
        }else{
            $dataHoje = date("Y-m-d");

            $dados['paciente'] = $this->pacientes->getPaciente(array( 'paciente_id' => $paciente_id ) );
            if( empty( $dados['paciente'] ) ){
                $this->session->set_flashdata('erros', 'Não estamos localizando um paciente com o código inserido, por favor tente novamente!');
                redirect("questionario/");
            }
            $dados['questionario'] = $this->questionarios->getQuestionario($paciente_id, $dataHoje);

            if( $dados['questionario'] ) {
                $this->session->set_flashdata('erros', 'Paciente ja respondeu o questionario hoje!');
                redirect("questionario/");
            }else{
                //print_r($dados['paciente']);
                $this->load->view('questionario/questionario', $dados);

            }

        }
    }

    public function resultado()
    {

        $dados = array();

        $dados['ok'] = $this->session->flashdata('ok');
        $dados['erros'] = $this->session->flashdata('erros');

        /*echo "<pre>";
        print_r($_POST);*/

        $paciente_id = $_POST["paciente_id"];

        $Somatorio = 0;

    $cabeca = $_POST["cabeca"];
    $Somatorio = $Somatorio + $cabeca;

    $desmaio = $_POST["desmaio"];
    $Somatorio = $Somatorio + $desmaio;

    $tonturas = $_POST["tonturas"];
    $Somatorio = $Somatorio + $tonturas;

    $insonia = $_POST["insonia"];
    $Somatorio = $Somatorio + $insonia;

    $cocando = $_POST["cocando"];
    $Somatorio = $Somatorio + $cocando;

    $inchados = $_POST["inchados"];
    $Somatorio = $Somatorio + $inchados;

    $olheiras = $_POST["olheiras"];
    $Somatorio = $Somatorio + $olheiras;

    $borrada = $_POST["borrada"];
    $Somatorio = $Somatorio + $borrada;

    $coceira = $_POST["coceira"];
    $Somatorio = $Somatorio + $coceira;

    $dores = $_POST["dores"];
    $Somatorio = $Somatorio + $dores;

    $fluido = $_POST["fluido"];
    $Somatorio = $Somatorio + $fluido;

    $zunido = $_POST["zunido"];
    $Somatorio = $Somatorio + $zunido;

    $entupido = $_POST["entupido"];
    $Somatorio = $Somatorio + $entupido;

    $sinusite = $_POST["sinusite"];
    $Somatorio = $Somatorio + $sinusite;

    $ataques = $_POST["ataques"];
    $Somatorio = $Somatorio + $ataques;

    $todos = $_POST["todos"];
    $Somatorio = $Somatorio + $todos;

    $muco = $_POST["muco"];
    $Somatorio = $Somatorio + $muco;

    $tosse = $_POST["tosse"];
    $Somatorio = $Somatorio + $tosse;

    $limpar = $_POST["limpar"];
    $Somatorio = $Somatorio + $limpar;

    $garganta = $_POST["garganta"];
    $Somatorio = $Somatorio + $garganta;

    $lingua = $_POST["lingua"];
    $Somatorio = $Somatorio + $lingua;

    $aftas = $_POST["aftas"];
    $Somatorio = $Somatorio + $aftas;

    $acne = $_POST["acne"];
    $Somatorio = $Somatorio + $acne;

    $pele = $_POST["seca"]; // foi setado no formulario com o nome seca, mais o correto seria pele
    $Somatorio = $Somatorio + $pele;

    $cabelo = $_POST["cabelo"];
    $Somatorio = $Somatorio + $cabelo;

    $vermelhidao = $_POST["vermelhidao"];
    $Somatorio = $Somatorio + $vermelhidao;

    $suor = $_POST["suor"];
    $Somatorio = $Somatorio + $suor;

    $falhando = $_POST["falhando"];
    $Somatorio = $Somatorio + $falhando;

    $rapido = $_POST["rapido"];
    $Somatorio = $Somatorio + $rapido;

    $dor = $_POST["dor"];
    $Somatorio = $Somatorio + $dor;

    $congestao = $_POST["congestao"];
    $Somatorio = $Somatorio + $congestao;

    $asma = $_POST["asma"];
    $Somatorio = $Somatorio + $asma;

    $folego = $_POST["folego"];
    $Somatorio = $Somatorio + $folego;

    $dificuldade = $_POST["dificuldade"];
    $Somatorio = $Somatorio + $dificuldade;

    $nauseas = $_POST["nauseas"];
    $Somatorio = $Somatorio + $nauseas;

    $diarreia = $_POST["diarreia"];
    $Somatorio = $Somatorio + $diarreia;

    $constipacao = $_POST["constipacao"];
    $Somatorio = $Somatorio + $constipacao;

    $destendido = $_POST["destendido"];
    $Somatorio = $Somatorio + $destendido;

    $arrotos = $_POST["arrotos"];
    $Somatorio = $Somatorio + $arrotos;

    $azia = $_POST["azia"];
    $Somatorio = $Somatorio + $azia;

    $estomacal = $_POST["estomacal"];
    $Somatorio = $Somatorio + $estomacal;

    $dorarticular = $_POST["dorarticular"];
    $Somatorio = $Somatorio + $dorarticular;

    $artrite = $_POST["artrite"];
    $Somatorio = $Somatorio + $artrite;

    $rigidez = $_POST["rigidez"];
    $Somatorio = $Somatorio + $rigidez;

    $dolorido = $_POST["dolorido"];
    $Somatorio = $Somatorio + $dolorido;

    $fraqueza = $_POST["fraqueza"];
    $Somatorio = $Somatorio + $fraqueza;

    $fadiga = $_POST["fadiga"];
    $Somatorio = $Somatorio + $fadiga;

    $apatia = $_POST["apatia"];
    $Somatorio = $Somatorio + $apatia;

    $hiperatividade = $_POST["hiperatividade"];
    $Somatorio = $Somatorio + $hiperatividade;

    $relaxar = $_POST["relaxar"];
    $Somatorio = $Somatorio + $relaxar;

    $memoria = $_POST["memoria"];
    $Somatorio = $Somatorio + $memoria;

    $confusao = $_POST["confusao"];
    $Somatorio = $Somatorio + $confusao;

    $concentracao = $_POST["concentracao"];
    $Somatorio = $Somatorio + $concentracao;

    $motora = $_POST["motora"];
    $Somatorio = $Somatorio + $motora;

    $decisao = $_POST["decisao"];
    $Somatorio = $Somatorio + $decisao;

    $repeticoes = $_POST["repeticoes"];
    $Somatorio = $Somatorio + $repeticoes;

    $pronuncia = $_POST["pronuncia"];
    $Somatorio = $Somatorio + $pronuncia;

    $aprendizagem = $_POST["aprendizagem"];
    $Somatorio = $Somatorio + $aprendizagem;

    $humor = $_POST["humor"];
    $Somatorio = $Somatorio + $humor;

    $ansiedade = $_POST["ansiedade"];
    $Somatorio = $Somatorio + $ansiedade;

    $raiva = $_POST["raiva"];
    $Somatorio = $Somatorio + $raiva;

    $depressao = $_POST["depressao"];
    $Somatorio = $Somatorio + $depressao;

    $doente = $_POST["doente"];
    $Somatorio = $Somatorio + $doente;

    $urinar = $_POST["urinar"];
    $Somatorio = $Somatorio + $urinar;

    $corrimento = $_POST["corrimento"];
    $Somatorio = $Somatorio + $corrimento;

    $edema = $_POST["edema"];
    $Somatorio = $Somatorio + $edema;

    if( ($Somatorio <= 20) || ($Somatorio <= 30)   ){
      $resultado = "Pessoas mais saudáveis, com menores chances de ter hipersenssibilidades";
    }else if( ($Somatorio > 30) and ($Somatorio < 40) ){
      $resultado = "Indicativo de existência de hipersensibilidades";
    }else if( ($Somatorio >= 40) and ($Somatorio < 100) ){
      $resultado = "Absoluta certeza de existencia de hipersensibilidade";
    }else if( ($Somatorio >= 100) ){
      $resultado = "Pessoas com saúde muito ruim - alta dificuldade para executar tarefas diárias, pode estar associado à presença de outras doenças crônicas e degenerativas";
    }

    //echo "Total: ".$Somatorio." - ".$resultado;

        $questionarioRespondido = array(
            'paciente_id' => $paciente_id,
            'cabeca' => $cabeca,
            'desmaio' => $desmaio,
            'tonturas' => $tonturas,
            'insonia' => $insonia,
            'cocando' => $cocando,
            'inchados' => $inchados,
            'olheiras' => $olheiras,
            'borrada' => $borrada,
            'coceira' => $coceira,
            'dores' => $dores,
            'fluido' => $fluido,
            'zunido' => $zunido,
            'entupido' => $entupido,
            'sinusite' => $sinusite,
            'ataques' => $ataques,
            'muco' => $muco,
            'todos' => $todos,
            'tosse' => $tosse,
            'limpar' => $limpar,
            'garganta' => $garganta,
            'lingua' => $lingua,
            'aftas' => $aftas,
            'acne' => $acne,
            'pele' => $pele,
            'cabelo' => $cabelo,
            'vermelhidao' => $vermelhidao,
            'suor' => $suor,
            'falhando' => $falhando,
            'rapido' => $rapido,
            'dor' => $dor,
            'congestao' => $congestao,
            'asma' => $asma,
            'folego' => $folego,
            'dificuldade' => $dificuldade,
            'nauseas' => $nauseas,
            'diarreia' => $diarreia,
            'constipacao' => $constipacao,
            'destendido' => $destendido,
            'arrotos' => $arrotos,
            'azia' => $azia,
            'estomacal' => $estomacal,
            'dorarticular' => $dorarticular,
            'artrite' => $artrite,
            'rigidez' => $rigidez,
            'dolorido' => $dolorido,
            'fraqueza' => $fraqueza,
            'fadiga' => $fadiga,
            'apatia' => $apatia,
            'hiperatividade' => $hiperatividade,
            'relaxar' => $relaxar,
            'memoria' => $memoria,
            'confusao' => $confusao,
            'concentracao' => $concentracao,
            'motora' => $motora,
            'decisao' => $decisao,
            'repeticoes' => $repeticoes,
            'pronuncia' => $pronuncia,
            'aprendizagem' => $aprendizagem,
            'humor' => $humor,
            'ansiedade' => $ansiedade,
            'raiva' => $raiva,
            'depressao' => $depressao,
            'doente' => $doente,
            'urinar' => $urinar,
            'corrimento' => $corrimento,
            'edema' => $edema,
            'somatorio' => $Somatorio,
            'resultado' => $resultado,
            'Cadastro' => date("Y-m-d")
        );

        $dados['somatorio'] = $Somatorio;

        $rs = $this->questionarios->adicionar($questionarioRespondido);
        if( $rs ) {
            $this->load->view('questionario/resultado', $dados);
        }else{
            $this->session->set_flashdata('erros', 'Erro ao processar o questionário!');
            redirect("questionario/");
        }


    }

}