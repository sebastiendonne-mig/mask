"""Clés de contrôle des identifiants (IBAN, SIREN, SIRET, TVA, NIR, carte) pour le jeu de
robustesse de mask. construire.py contrôle chaque identifiant à partir du texte tel qu'écrit."""
import re

def luhn_ok(d):
    s = 0
    for i, c in enumerate(reversed(d)):
        n = int(c)
        if i % 2 == 1:
            n *= 2
            if n > 9: n -= 9
        s += n
    return s % 10 == 0

def luhn_complete(prefix):
    for k in range(10):
        if luhn_ok(prefix + str(k)):
            return prefix + str(k)

def siren(base8):
    return luhn_complete(base8)

def siret(siren9, nic4):
    return luhn_complete(siren9 + nic4)

def tva(siren9):
    k = (12 + 3 * (int(siren9) % 97)) % 97
    return f"FR{k:02d}{siren9}"

def tva_ok(s):
    s = re.sub(r"[^0-9A-Z]", "", s.upper())
    return s.startswith("FR") and int(s[2:4]) == (12 + 3 * (int(s[4:]) % 97)) % 97 and luhn_ok(s[4:])

def iban_ok(s):
    s = re.sub(r"[^0-9A-Z]", "", s.upper())
    r = s[4:] + s[:4]
    num = "".join(str(int(c, 36)) for c in r)
    return int(num) % 97 == 1

def iban_from_bban(country, bban):
    r = bban + country + "00"
    num = "".join(str(int(c, 36)) for c in r)
    k = 98 - int(num) % 97
    return f"{country}{k:02d}{bban}"

def rib_key(banque, guichet, compte):
    # lettres du compte converties selon la table RIB (non utilisées ici)
    return 97 - ((89 * int(banque) + 15 * int(guichet) + 3 * int(compte)) % 97)

def iban_fr(banque, guichet, compte):
    cle = rib_key(banque, guichet, compte)
    return iban_from_bban("FR", f"{banque}{guichet}{compte}{cle:02d}")

def nir(treize):
    t = treize.upper().replace("2A", "19").replace("2B", "18")
    return 97 - int(t) % 97

def nir_ok(s):
    d = re.sub(r"[^0-9AB]", "", s.upper())
    corps, cle = d[:13], int(d[13:])
    return len(d) == 15 and nir(corps) == cle

def group(s, n=4):
    return " ".join(s[i:i + n] for i in range(0, len(s), n))
