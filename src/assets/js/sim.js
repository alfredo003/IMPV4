var visited_host = [];

var private_subnets = [
    {'hid':'__none__', 'rid':'private_class_A', 'route':'10.0.0.0/8', 'gate':'0.0.0.0', 'route_edit':'false', 'gate_edit':'false', 'h':{'type':'internet'}},
    {'hid':'__none__', 'rid':'private_class_B', 'route':'172.16.0.0/12', 'gate':'0.0.0.0', 'route_edit':'false', 'gate_edit':'false', 'h':{'type':'internet'}},
    {'hid':'__none__', 'rid':'private_class_C', 'route':'192.168.0.0/16', 'gate':'0.0.0.0', 'route_edit':'false', 'gate_edit':'false', 'h':{'type':'internet'}}
];

// simulate network


function ip_to_int(s)
{
    var tab = s.split('.');
    tab.forEach((el, idx) => {this[idx] = parseInt(el);});
    if (tab.length != 4) return (null);
    if (isNaN(tab[0]) || tab[0] < 0 || tab[0] > 223 || isNaN(tab[1]) || tab[1] < 0 || tab[1] > 255 ||
	isNaN(tab[2]) || tab[2] < 0 || tab[2] > 255 || isNaN(tab[3]) || tab[3] < 0 || tab[3] > 255) return (null);
    if (tab[0] == 127) { g_sim_logs += "Endereço de loopback detectado na interface externa\n"; return (null); }
    return ( ( (tab[0] << 24) | (tab[1] << 16) | (tab[2] << 8) | (tab[3]) ) >>> 0);
}

function mask_to_int(s)
{
    if (s.length == 0) return (null);
    if (s[0] == '/')
    {
	var cidr = parseInt(s.substring(1));
	if (isNaN(cidr) || cidr < 0 || cidr > 32) return (null);
	if (cidr == 32) return ((-1)>>>0);
	return ( ((((1 << cidr)>>>0)-1) << (32-cidr))>>>0 );
    }
    var tab = s.split('.');
    tab.forEach((el, idx) => {this[idx] = parseInt(el);});
    if (tab.length != 4) return (null);
    if (isNaN(tab[0]) || tab[0] < 0 || tab[0] > 255 || isNaN(tab[1]) || tab[1] < 0 || tab[1] > 255 ||
	isNaN(tab[2]) || tab[2] < 0 || tab[2] > 255 || isNaN(tab[3]) || tab[3] < 0 || tab[3] > 255) return (null);
    if (tab[0] != 255 && (tab[1] != 0 || tab[2] != 0 || tab[3] != 0)) return (null);
    if (tab[0] == 255 && tab[1] != 255 && (tab[2] != 0 || tab[3] != 0)) return (null);
    if (tab[0] == 255 && tab[1] == 255 && tab[2] != 255 && tab[3] != 0) return (null);
    // magic trick to check if we have continuity of 1 then 0
    var mask = ( ( ( tab[0] << 24) | (( tab[1] ) << 16) | (( tab[2] ) << 8) | ( tab[3] ) ) >>> 0);
    if (mask == 0) return (0);
    if ( ( ((~mask)+1) & (~mask) ) == 0)
	return (mask);
    return (null);
}



// mask on interface
function get_if_mask_str(itf)
{
    if (itf['mask_edit'] == 'true')
	return (document.getElementById('mask_'+itf['if']).value);
    return (itf['mask']);
}
function get_if_mask(itf)
{
    return (mask_to_int(get_if_mask_str(itf)));
}

// ip on interface
function get_if_ip_str(itf)
{
    if (itf['ip_edit'] == 'true')
	return (document.getElementById('ip_'+itf['if']).value);
    return (itf['ip']);
}
function get_if_ip(itf)
{
    var the_ip = ip_to_int(get_if_ip_str(itf));
    // check if ip is not the network or broadcast address
    var the_mask = get_if_mask(itf);
    if ( (the_ip & (~the_mask)) == 0 ||
	 (the_ip & (~the_mask)) == (~the_mask) )
	return (null);
    return (the_ip);
}


// route in routes
function get_route_route_str(r)
{
    if (r['route_edit'] == 'true')
	return (document.getElementById('route_'+r['rid']).value);
    return (r['route']);
}

// gate in routes
function get_route_gate_str(r)
{
    if (r['gate_edit'] == 'true')
	return (document.getElementById('gate_'+r['rid']).value);
    return (r['gate']);
}
function get_route_gate(r)
{
    return (ip_to_int(get_route_gate_str(r)));
}



function ip_match_if(ip, itf)
{
    var iip, imask;
    if ((iip = get_if_ip(itf)) === null) { g_sim_logs += 'Na interface '+itf['if']+': endereço IP inválido\n'; return (0); }
    if ((imask = get_if_mask(itf)) === null) { g_sim_logs += 'Na interface '+itf['if']+': máscara de rede inválida\n'; return (0); }
//    my_console_log("## "+iip+" & "+imask+" == "+ip+" & "+imask);
    if (iip == ip) { g_sim_logs += "IP duplicado ("+get_if_ip_str(itf)+")\n"; return (0); }
    if ((iip & imask) == (ip & imask))
    {
	// if ip match the interface network, check that the ip is not the network addr or broadcast ?
	return (1);
    }
    return (0);
}


function ip_match_route(ip, r)
{
    var str, rip, rmask;
    str = get_route_route_str(r);
    if (str == 'default') str = '0.0.0.0/0';
//    my_console_log("ip_match_route route :"+JSON.stringify(r));
    if (r['h']['type'] == "internet" && str == '0.0.0.0/0')
    { g_sim_logs += 'Rota padrão inválida na internet '+r['hid']+'\n'; return (0); }
    var tab = str.split('/');
//    my_console_log("ip_match_route check : "+str+" againt ip "+ip);
    if (tab.length != 2)
    { g_sim_logs += 'Rota inválida no host '+r['hid']+'\n'; return (0); }
    if ((rip = ip_to_int(tab[0])) === null)
    { g_sim_logs += 'Rota inválida no host '+r['hid']+'\n'; return (0); }
    if ((rmask = mask_to_int('/'+tab[1])) === null)
    { g_sim_logs += 'Rota inválida no host '+r['hid']+'\n'; return (0); }
    if ((rip & rmask) == (ip & rmask)) return (1);
    return (0);
}




function rec_route(ip_dest, local_target, input_itf, h)   // return array of dest itf
{
    var i, nbif, nb_routes, ret, j;
    var itf_ip;
    
    if (input_itf != null)
	my_console_log(" ** to "+ip_dest+" / host "+h['id']+" input itf "+input_itf['if']+" / to match local target "+local_target);
    else
	my_console_log(" ** to "+ip_dest+" / host "+h['id']);

    // loop detection here
    if (visited_host.includes(h)) { g_sim_logs += "No "+h['id']+': loop detectado\n'; return ([]); }
    visited_host.push(h);

    // if switch : rec_route to all links
    if (h['type'] == 'switch')
    {
	g_sim_logs += 'No switch '+h['id']+': passando para todas as conexões\n';
	ret = [];
	links.forEach(l => {if (l['e1']['hid'] == h['id']) ret = ret.concat(rec_route(ip_dest, local_target, l['e2'], l['h2']));
			    else if (l['e2']['hid'] == h['id']) ret = ret.concat(rec_route(ip_dest, local_target, l['e1'], l['h1']))});
	return (ret);
    }
    
    // on a host, is my current gate ip == the ip of the input itf ?
    if (input_itf != null)
    {
	if ((itf_ip = get_if_ip(input_itf)) === null) { g_sim_logs += 'No '+h['id']+': IP inválido na interface de entrada '+input_itf['if']+'\n'; return ([]); }
	if (itf_ip != local_target) { g_sim_logs += 'No '+h['id']+': pacote não é para mim\n'; return ([]); }
    }

    // accepted on host
    g_sim_logs += 'No '+h['id']+': pacote aceito\n';

    // internet does no route private addresses, so "internet interface" reject private subnets
    if (h['type'] == 'internet')
    {
	if (ip_match_route(ip_dest, private_subnets[0]) || ip_match_route(ip_dest, private_subnets[1]) || ip_match_route(ip_dest, private_subnets[2]))
	{ g_sim_logs += 'Subredes privadas não são roteadas pela internet\n'; return ([]); }
    }
    
   // arrived ?   check not only input itf, in case another itf is the target;  do not check if input_itf is null (departure host)
    if (input_itf != null)
    {
	ret = [];
	ifs.forEach(itf => {if (itf['hid'] == h['id'] && (itf_ip = get_if_ip(itf)) !== null && ip_dest === itf_ip) ret.push(itf);});
	if (ret.length > 0) { g_sim_logs += 'No '+h['id']+': IP de destino alcançado\n'; my_console_log("Destino alcançado!"); return (ret); }
    }

    // ip_dest match an interface ?
    my_console_log('on '+h['id']+': check '+ip_dest+" against all interfaces");
    nbif = 0; ret = [];
    for (i = 0; i < ifs.length; i++)
    {
	if (ifs[i]['hid'] == h['id'])
	{
	    my_console_log("   chk with itf "+ifs[i]['if']);
	    if (ip_match_if(ip_dest, ifs[i]))
	    {
		my_console_log("   match itf "+ifs[i]['if']);
		nbif ++;
		g_sim_logs += 'No '+h['id']+': enviando para '+ifs[i]['if']+'\n';
		links.forEach(l => {if (l['if1'] == ifs[i]['if']) ret = ret.concat(rec_route(ip_dest, ip_dest, l['e2'], l['h2']));
				    else if (l['if2'] == ifs[i]['if']) ret = ret.concat(rec_route(ip_dest, ip_dest, l['e1'], l['h1']))});
	    }
	}
    }
     // force fail if multiple ifs on same subnet
    if (nbif > 1) { g_sim_logs += 'No '+h['id']+': erro no IP de destino - múltiplas interfaces correspondem\n'; return ([]); }
    if (nbif == 1) return (ret);

    // else nbif == 0, no interface match, explore routes
    my_console_log("  no itf for ip destination, go through gate");
    g_sim_logs += 'No '+h['id']+': destino não corresponde a nenhuma interface. Passando pela tabela de roteamento\n';

    ret = [];
    nb_routes = 0;
    for (j = 0; j < routes.length; j++)
    {
	if (routes[j]['hid'] == h['id'])
	{
	    if (ip_match_route(ip_dest, routes[j]))
	    {
		g_sim_logs += 'No '+h['id']+': rota corresponde '+get_route_route_str(routes[j])+'\n';
		nb_routes ++;
		var ip_gate = get_route_gate(routes[j]);
		if (ip_gate === null) { g_sim_logs += "No "+h['id']+": IP do gateway inválido, rota "+get_route_route_str(routes[j])+"\n"; return ([]);}
		nbif = 0;
		for (i = 0; i < ifs.length; i++)
		{
		    if (ifs[i]['hid'] == h['id'])
		    {
			if (ip_match_if(ip_gate, ifs[i]))
			{
			    my_console_log("   gate ip match itf "+ifs[i]['if']);
			    g_sim_logs += 'No '+h['id']+': enviando para gateway '+get_route_gate_str(routes[j])+' através da interface '+ifs[i]['if']+'\n';
			    nbif ++;
			    links.forEach(l => {if (l['if1'] == ifs[i]['if']) ret = ret.concat(rec_route(ip_dest, ip_gate, l['e2'], l['h2']));
						else if (l['if2'] == ifs[i]['if']) ret = ret.concat(rec_route(ip_dest, ip_gate, l['e1'], l['h1']))});
			}
		    }
		}
		if (nbif > 1) { g_sim_logs += 'No '+h['id']+': erro no IP do gateway - múltiplas interfaces correspondem\n'; return ([]); }
	    }
	}
	if (nb_routes > 0)  // only first route is explored.
	{
	    if (nbif == 0) g_sim_logs += 'No '+h['id']+': rota corresponde mas não há interface para o gateway '+get_route_gate_str(routes[j])+'\n';
	    return (ret);
	}
    }
    // no match, fail
    g_sim_logs += 'No '+h['id']+': destino não corresponde a nenhuma rota\n';
    return ([]);
}



function sim_reach_gen(g)
{
    my_console_log("check reach "+g['dst_name']+" : "+g['src']+" -> "+g['dst']);
    var ret = [];
    var i;
    var itf_ip;
    for (i = 0; i < ifs.length; i++)
    {
	if (g['dst'] == ifs[i][g['dst_type']])
	{
	    visited_host = [];
	    if ((itf_ip = get_if_ip(ifs[i])) === null)
		g_sim_logs += "on inerface "+ifs[i]['if']+": invalid IP\n";
	    else
	    {
		g_sim_logs +="forward way : "+g['src']+" -> "+g['dst']+" ("+get_if_ip_str(ifs[i])+")\n";
		ret = ret.concat(rec_route(itf_ip, 0, null, g['h1']));
	    }
	    if (ret.length > 0)
		break;     // if one interface matches, that's enough - if ret > 1 it's because another host matches
	}
    }
    if (ret.length <= 0) return ({text:'ERRO - Tente novamente...', status:0});
    if (ret.length > 1) return ({text:'ERRO - Múltiplos hosts de destino correspondem...', status:0});
    if (ret[0][g['dst_type']] != g['dst']) return ({text:'ERRO - IP correto alcançado mas '+g['dst_name']+' errado, tente novamente...', status:0});
    
    // now reverse way

    my_console_log("check reach "+g['src_name']+" : "+g['dst']+" -> "+g['src']);
    ret = [];
    for (i = 0; i < ifs.length; i++)
    {
	if (g['src'] == ifs[i][g['src_type']])
	{
	    visited_host = [];
	    if ((itf_ip = get_if_ip(ifs[i])) === null)
                g_sim_logs += "on interface "+ifs[i]['if']+": invalid IP\n";
            else
            {
                g_sim_logs +="reverse way : "+g['dst']+" -> "+g['src']+" ("+get_if_ip_str(ifs[i])+")\n";
                ret = ret.concat(rec_route(itf_ip, 0, null, g['h2']));
            }
            if (ret.length > 0)
                break;     // if one interface matches, that's enough - if ret > 1 it's because another host matches
	}
    }
    if (ret.length <= 0) return ({text:'ERRO - Sem caminho de volta, tente novamente...', status:0});
    if (ret.length > 1) return ({text:'ERRO - Múltiplos hosts de origem correspondem...', status:0});
    if (ret[0][g['src_type']] != g['src']) return ({text:'ERRO - IP correto alcançado mas '+g['src_name']+' errado, tente novamente...', status:0});
    
    return ({text:'OK - Parabéns!!', status:1});
}



function sim_goal(g)
{
    return (sim_reach_gen(g));
    
//    if (g['type'] == 'reach')
//	return (sim_reach(g));
//    if (g['type'] == 'reach_if')
//	return (sim_reach_if(g));
}
