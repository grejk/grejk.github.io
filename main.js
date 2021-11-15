data = data.split("\n")
extensions = {} //store cards by serie_extension
cart = [] //used to store cards you want to buy

load_cart() //get previous session cart from localStorage
$("#copyToClipBoard").on("click", copy)

quality = {
    "1": "excellent",
    "2": "très bon",
    "3": "bon",
    "4": "moyen",
    "5": "abimé"
}
filters = {
    "extension": "",
    "quality": ["excellent", "très bon", "bon", "moyen", "abimé"],
    "rarity": ["commune", "peu commune", "rare"]
}

quality_count = {}
rarity_count = {}

data.forEach(c => {
    if (c != "") {
        c = c.split(";")
        c[5] = c[5].replace("NULL", "Dresseur")
        c[6] = quality[c[6]]
        c.push(c[0].split("/")[4].split(".")[0]) //extract picture name to use it as ID
        ext = c[0].split("/")[1] + "_" + c[0].split("/")[2]
        if (ext in extensions) {
            extensions[ext].push(c)
        } else {
            extensions[ext] = [c]
        }
    }
});

//fill the select extension filter
for (const e in extensions) {
    $("#extensions").append(`<option value="${e}">${e.replace("_"," ")} (${extensions[e].length})</option>`)
}

function get_html_rarity(rarity) {
    rarity = rarity.toLowerCase().trim()
    if (rarity == "commune") {
        html = `<span title="Commune">⚫</span>`
    } else if (rarity == "peu commune") {
        html = `<span title="Peu Commune">🔷</span>`
    } else {
        html = `<span title="Rare">⭐</span>`
    }
    return html
}

function cart_transfer_button(card) {
    if (cart.includes(card)) {
        html = `<a title="Retirer du panier" id="list-${card[8]}" data-extension="${card[0].split("/")[1]+"_"+card[0].split("/")[2]}" class="btn btn-danger btn-sm cart-transfer">⛔</a>`
    } else {
        html = `<a title="Ajouter au panier" id="list-${card[8]}" data-extension="${card[0].split("/")[1]+"_"+card[0].split("/")[2]}" class="btn btn-success btn-sm cart-transfer">🛒</a>`
    }
    return html
}

function load_cart() {
    storage = localStorage.getItem("pokemon_cart")
    console.log(storage);
    if (storage) {
        console.log("storage found");
        cart = JSON.parse(storage)
        cart_list_count()
        cart.forEach(card => {
            html_cart(card)
        });
        total_compute()
    }
}

function save_cart() {
    localStorage.setItem("pokemon_cart", JSON.stringify(cart))
    localStorage.setItem('value1', 'true');
    console.log("cart has been save to localStorage");
}

function copy(e) {
    input = ""
    cart.forEach(card => {
        input += card.join(";") + "\n"
    });
    if (navigator.clipboard) {
        navigator.clipboard.writeText(input).then(() => {
            console.log('Copied to clipboard successfully.');
            $(e.target).removeClass("btn-primary")
            $(e.target).addClass("btn-success")
            $(e.target).text("Votre panier a été copié (ctrl+v pour le coller)")
        }, (err) => {
            $(e.target).removeClass("btn-primary")
            $(e.target).addClass("btn-danger")
            $(e.target).text("⚠️ Votre panier n'a pas pu être copié !")
            window.alert(input)
        });
        setTimeout(() => {
            $(e.target).removeClass("btn-danger")
            $(e.target).removeClass("btn-success")
            $(e.target).addClass("btn-primary")
            $(e.target).text("⏏️ Copier mon panier ")
        }, 5000);
    } else if (window.clipboardData) {
        window.clipboardData.setData("Text", input);
    }

}

function modal_change(e) {
    var myModal = new bootstrap.Modal(document.getElementById('modalContent'))
    document.querySelector("#modalContent img").src = e.target.src
    myModal.toggle()
}

function card_list_count() {
    // display # of card displayed in "cartes" tab
    $("#nav-cards-tab .badge").text($(".card:not(.hidden)").length)
}

function cart_list_count() {
    // display # of card in "cart" tab
    $("#nav-cart-tab .badge").text(cart.length)
}

function html_cart(card) {
    //create html tag of card and put it in the cart tab list
    html = `            
        <li class="list-group-item">
            <button 
                class="btn btn-danger btn-sm btn-cart" 
                data-extension="${card[0].split("/")[1]+"_"+card[0].split("/")[2]}"
                id="cart-${card[8]}">⛔
            </button>
            <span>${card[0].split("/")[1]+" "+card[0].split("/")[2]}</span> - 
            <span>#${card[1]}/${card[2]}</span> -
            <span>${card[3]}</span> -
            <span>${card[4]}</span> -
            <span>${card[6]}</span> -
            <span>${card[7]}€</span> 
        </li>
        `
    $("#cart-list").append(html)
    $(`#cart-${card[8]}`).on("click", cart_transfert)
}

function cart_transfert(e) {
    // add or remove card from cart
    id = e.target.id.split("-")[1]
    card = extensions[e.target.dataset["extension"]].filter(c => c[8] == id)[0];
    if (e.target.className.includes("btn-danger")) {
        console.log("remove card from cart");
        cart = cart.filter(c => c[8] != id)
        //if the current extension is different from the card to remove extension i will throw an error of no element found
        try {
            $(`#cart-${card[8]}`).parent().remove()
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log("add card to cart");
        cart.push(card)
        html_cart(card)
    }

    if (e.target.className.includes("btn-cart")) {
        //if the current extension is different from the card to remove extension i will throw an error of no element found
        try {
            $($(`#list-${id}`).parent()).append(cart_transfer_button(card))
            $(document.querySelector(`#list-${id}`)).remove()
        } catch (error) {
            console.log(error);
        }
    } else {
        $(e.target.parentElement).append(cart_transfer_button(card))
        $(e.target).remove()
    }
    $(`#list-${card[8]}`).on("click", cart_transfert)
    total_compute()
    cart_list_count()
    save_cart()
}

function total_compute() {
    //compute cost of cart and display it
    cost = {
        "fees": 0,
        "shipping": 0,
        "subTotal": 0,
        "total": 0
    }
    if (cart.length) {
        cart.forEach(c => {
            cost["subTotal"] += parseFloat(c[7])
        });
        cost["fees"] = cost["subTotal"] * 0.05 + 0.7
        count = cart.length
        if (count * 3 < 18) {
            cost["shipping"] = 1.6 //tracked letter
        } else if (count * 3 < 500) {
            cost["shipping"] = 2.88 //small packaging
        } else if (count * 3 < 500) {
            cost["shipping"] = 3.28 //medium packaging
        } else {
            cost["shipping"] = 3.78 //big packaging
        }
    }
    // display cost into invoice part
    for (const key in cost) {
        $(`#${key} .value`).text(Math.round(cost[key] * 100) / 100)
        cost["total"] += cost[key]
    }
}

$("#rarity .form-check-input").on("change", function (e) {
    $("#nav-cards-tab").click() //display "cartes" tab
    if (e.target.checked) {
        $(".rarity-" + e.target.value).removeClass("hidden")
        filters["rarity"].push(e.target.value)
    } else {
        $(".rarity-" + e.target.value).addClass("hidden")
        filters["rarity"] = filters["rarity"].filter(r => r != e.target.value)
    }
    card_list_count()
})

$("#quality .form-check-input").on("change", function (e) {
    $("#nav-cards-tab").click() //display "cartes" tab
    if (e.target.checked) {
        $(".quality-" + e.target.value).removeClass("hidden")
        filters["quality"].push(e.target.value)
    } else {
        $(".quality-" + e.target.value).addClass("hidden")
        filters["quality"] = filters["quality"].filter(q => q != e.target.value)
    }
    card_list_count()
})

$("#extensions").on("change", function name(e) {
    $("#nav-cards-tab").click() //display "cartes" tab
    $("#cards").html("")
    if ($("#extensions").val() == 0) {
        card_list_count()
        return //for "selectionnez une extension" case
    }
    $("#cards").hide()
    // $("#cards").removeClass("d-flex") //if not removed the .hide() doesn't work
    $("#loader").show()

    $("input").prop("checked", true)

    filters["extension"] = $("#extensions").val()
    quality_count = {
        "excellent": 0,
        "très bon": 0,
        "bon": 0,
        "moyen": 0,
        "abimé": 0
    }
    rarity_count = {
        "commune": 0,
        "peu commune": 0,
        "rare": 0,
    }
    i=0
    $("#cards").append(`<div class="d-flex flex-row flex-wrap justify-content-between part"></div>`)
    extensions[$("#extensions").val()].forEach(a => {
        //create and append card tag
        quality_count[a[6]]++
        rarity_count[a[4]]++
        html = `
             <div class="card rarity-${a[4].replace(" ","-")} quality-${a[6].replace(" ","-")}" id="${a[1]}_${a[2]}_${a[3]}">
                 <div class="card-header">
                    <span class="number">#${a[1]}/${a[2]}</span> -
                    <span class="name">${a[3]}</span> -
                    <span class="rarity">${get_html_rarity(a[4])}</span> 
                 </div>
                 <div class="card-body">
                 <div class="img">
                 <img src="${a[0]}" class="card-img-top" alt="...">
                 <small>Cliquez sur la carte pour l'agrandir</small>
                 </div>
                    ${cart_transfer_button(a)}
                 </div>
                 <div class="card-footer text-muted">
                 <span class="type_${a[5]}">${a[5]}</span> - 
                 <span title="Etat : ${a[6]}">${a[6]}</span> -
                 <span>${a[7]}€</span>
                 </div>
             </div>`
        if (i==9) {
            $("#cards").append(`<div class="d-flex flex-row flex-wrap justify-content-between part"></div>`)
            i=0
        }
        i++
        $("#cards .part:last-of-type").append(html)

    });

    $("#cards img").on("click", modal_change)
    $("#cards .cart-transfer").on("click", cart_transfert)

    //update # of card by quality
    for (const q in quality_count) {
        $(`input[value="${q.replace(" ","-")}`).next().children("label .badge").text(quality_count[q])
    }

    //update # of card by rarity
    for (const r in rarity_count) {
        $(`input[value="${r.replace(" ","-")}`).next().children("label .badge").text(rarity_count[r])
    }

    //waiting for images to be fully loaded
    $('#cards img').on('load', function () {
        $("#cards").show()
        // $("#cards").addClass("d-flex")
        $("#loader").hide()
    });
    card_list_count()

})

function list_of_extension(){
    text=""
    for (const extension in extensions) {
        text+=`
        #Titre:Lot de ${extensions[extension].length} cartes pokémon ${extension}
        #Description:Lot de ${extensions[extension].length} cartes pokémon officielles et françaises : ${extension}

        ${card_list(extensions[extension])}
        La description et l'état sont donnés à titre indicatifs. Vérifiez sur les photos.
        Achat à l'unité possible et entre les différents lot sur mon dressing.
        Merci de me communiquer l'ID de la carte ou passez par mon site.

        Vous pouvez retrouver toutes mes cartes à vendre et leur photo individuelle ici : https://grejk.github.io/
        Mes autres annonces cartes et rangements pokémon à vendre : #MuchacookiesPokemon

        Lettre suivie ou colis selon votre préférence.
        Envoi rapide !
        #Prix:${extension_price(extensions[extension])}
        --------------------------------------------------------
        `
     }
     console.log(text);
}

function card_list(cards) {
    res=""
    // console.log(cards);
    cards.forEach(c => {
    res+=`${c[1]}/${c[2]} - ${c[3]} - ${c[4]} - ${c[6]} - (ID carte : ${c[8]})
            `
    });
    // console.log(res);
    return res
}

function extension_price(cards) {
    total=0
    cards.forEach(c => {
        total+=parseFloat(c[7])
    });
    return Math.round(total * 100) / 100
}
