<?php
header("Access-Control-Allow-Origin: *");
//date_default_timezone_set('America/Chicago');
date_default_timezone_set('UTC');

// http://www.cmegroup.com/trading/energy/crude-oil/light-sweet-crude.html

if (!isset($_GET['type'])) exit('invalid request');

switch ($_GET['type']) {
	case 'OTC':

		if (isset($_GET['date'])) {
			$date = $_GET['date'];
		} else {
			$date = new \DateTime();
			$date = $date->format('mdY');
		}

		$data = get_data(
			"http://www.cmegroup.com/CmeWS/mvc/xsltTransformer.do?xlstDoc=/XSLT/md/blocks-records.xsl&url=/da/BlockTradeQuotes/V1/Block/BlockTrades?exchange=XNYM&foi=OPT&subGroup=10&tradeDate=".$date."&sortCol=time&sortBy=desc"
			);

		exit( substr($data, strpos($data,'<span')) );


		break;

	case 'FUTsettle':

		if (isset($_GET['date'])) {
			$date = \DateTime::createFromFormat("mdY",$_GET['date'])->format('m/d/Y');
		} else {
			$date = new \DateTime();
			$date = $date->format('m/d/Y');
		}	

		exit(get_data(
			"http://www.cmegroup.com/CmeWS/mvc/Settlements/Futures/Settlements/425/FUT?tradeDate=".$date."&strategy=DEFAULT&pageSize=50"
			));

		break;

	case 'FUTquote':

//"http://www.cmegroup.com/CmeWS/mvc/Quotes/FutureContracts/XNYM/G?quoteCodes=CLK7,CLM7,CLN7,CLQ7,CLU7,CLV7,CLX7,CLZ7,CLF8,CLG8,CLH8,CLJ8,CLK8,CLM8,CLN8,CLQ8,CLU8,CLV8,CLX8,CLZ8,CLF9,CLG9,CLH9,CLJ9,CLK9,CLM9,CLN9,CLQ9,CLU9,CLV9,CLX9,CLZ9,CLF0,CLG0,CLH0,CLJ0,CLK0,CLM0,CLN0,CLQ0,CLU0,CLV0,CLX0,CLZ0,CLF1,CLG1,CLH1,CLJ1,CLK1,CLM1,CLN1,CLQ1,CLU1,CLV1,CLX1,CLZ1,CLF2,CLG2,CLH2,CLJ2,CLK2,CLM2,CLN2,CLQ2,CLU2,CLV2,CLX2,CLZ2,CLM3,CLZ3,CLM4,CLZ4,CLM5,CLZ5&_=1490278732771"	

		exit(get_data(
			"http://www.cmegroup.com/CmeWS/mvc/Quotes/FutureContracts/XNYM/G?quoteCodes=".$_GET['contracts']
			));
		break;		

	case 'OPTquote':

//http://www.cmegroup.com/CmeWS/mvc/Quotes/OptionContracts/XNYM/G?futureQuoteCode=CLJ7&optionQuoteCodes=LOJ7+C4650,LOJ7+P4650,LOJ7+C4700,LOJ7+P4700,LOJ7+C4750,LOJ7+P4750,LOJ7+C4800,LOJ7+P4800,LOJ7+C4850,LOJ7+P4850,LOJ7+C4900,LOJ7+P4900,LOJ7+C4950,LOJ7+P4950,LOJ7+C5000,LOJ7+P5000,LOJ7+C5050,LOJ7+P5050,LOJ7+C5100,LOJ7+P5100&isPitTraded=N&_=1490279289857
		
		exit(get_data("http://www.cmegroup.com/CmeWS/mvc/Quotes/OptionContracts/XNYM/G?optionQuoteCodes=".$_GET['contracts']."&isPitTraded=N"));
		

		break;

	case 'OPTsettle':

		if (isset($_GET['date'])) {
			$date = \DateTime::createFromFormat("mdY",$_GET['date'])->format('m/d/Y');
		} else {
			$date = new \DateTime();
			$date = $date->format('m/d/Y');
		}

		// $_GET['monthYear'] in the format 'K17'

		switch ($_GET['contract']) {
			case 'LO':
		
				exit(get_data("http://www.cmegroup.com/CmeWS/mvc/Settlements/Options/Settlements//190/OOF?tradeDate=".$date."&monthYear=LO".$_GET['monthYear']."&strategy=DEFAULT&pageSize=50"));

				break;
			
			case 'WA':


			// like "http://www.cmegroup.com/CmeWS/mvc/Settlements/Options/Settlements//769/OOF?monthYear=WAK17&strategy=DEFAULT&optionProductId=769&tradeDate=03/22/2017&pageSize=50"

				break;

			default:
				exit('invalid request');
				break;
		}
		

		break;		
	
	default:
		exit('invalid request');
		break;
}


function get_data($url) {
	$ch = curl_init();
	$timeout = 5;
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	$data = curl_exec($ch);
	curl_close($ch);
	return $data;
}
