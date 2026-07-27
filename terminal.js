(function () {
    const cmd1 = "pip install fcetool";
    const cmd2 = "fcetool -h";
    
    const el1 = document.getElementById("line1");
    const el2 = document.getElementById("line2");
    if (!el1 || !el2) return;

    let i = 0;
    function type1() {
        if (i < cmd1.length) {
            el1.textContent += cmd1.charAt(i);
            i++;
            setTimeout(type1, 45);
        } else {
            setTimeout(type2, 350);
        }
    }

    let j = 0;
    function type2() {
        if (j < cmd2.length) {
            el2.textContent += cmd2.charAt(j);
            j++;
            setTimeout(type2, 45);
        }
    }

    type1();
})();
