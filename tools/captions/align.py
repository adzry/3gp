"""Forced alignment helper for `npm run align` (pocketsphinx, BSD).

Usage: python3 align.py <16k-mono-pcm16.wav> <tokens.json>
tokens.json: ["right", "now", ...] — lower-case dictionary words, in order.
Prints JSON: [{"t": token, "s": start_s, "e": end_s}, ...] (no silences).
Unknown words are composed from two dictionary words when possible
("microseconds" = "micro" + "seconds"); otherwise it exits with an error.
"""
import json
import os
import sys
import wave

from pocketsphinx import Decoder, get_model_path


def load_dict(path):
    d = {}
    with open(path, encoding="utf8") as f:
        for line in f:
            parts = line.split()
            if parts and "(" not in parts[0]:
                d.setdefault(parts[0], " ".join(parts[1:]))
    return d


def compose(word, d):
    for i in range(len(word) - 2, 1, -1):
        a, b = word[:i], word[i:]
        if a in d and b in d:
            return d[a] + " " + d[b]
    return None


def main():
    wav_path, tokens_path = sys.argv[1], sys.argv[2]
    tokens = json.load(open(tokens_path))
    dict_path = os.path.join(get_model_path(), "en-us", "cmudict-en-us.dict")
    d = load_dict(dict_path)
    decoder = Decoder(samprate=16000, bestpath=False, loglevel="FATAL")
    missing = []
    for t in sorted(set(tokens)):
        if t in d:
            continue
        phones = compose(t, d)
        if phones:
            decoder.add_word(t, phones, True)
        else:
            missing.append(t)
    if missing:
        sys.exit("not in the pronunciation dictionary: " + ", ".join(missing))
    with wave.open(wav_path, "rb") as w:
        if w.getframerate() != 16000 or w.getnchannels() != 1:
            sys.exit("expected 16 kHz mono PCM")
        data = w.readframes(w.getnframes())
    decoder.set_align_text(" ".join(tokens))
    decoder.start_utt()
    decoder.process_raw(data, full_utt=True)
    decoder.end_utt()
    decoder.set_alignment()
    decoder.start_utt()
    decoder.process_raw(data, full_utt=True)
    decoder.end_utt()
    out = []
    for seg in decoder.get_alignment():
        name = seg.name.split("(")[0]
        if name.startswith("<") or name.startswith("["):
            continue
        out.append({"t": name, "s": seg.start / 100, "e": (seg.start + seg.duration) / 100})
    print(json.dumps(out))


main()
