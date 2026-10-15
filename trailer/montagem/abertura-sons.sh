#!/data/data/com.termux/files/usr/bin/bash
# Sons da abertura nova ("Um MEWTWO selvagem apareceu!"): gerados com ffmpeg, determinísticos. Chamado pelo preparar.sh.
set -e
cd "$(dirname "$0")"
M=midia
# bipes de texto do Game Boy: onda quadrada curta a cada 2 letras (0,06 s)
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.25*sgn(sin(2*PI*1350*t))*lt(mod(t\,0.06)\,0.022):s=44100:d=1.0" $M/bipes.wav
# grito do Mewtwo grave e arrastado (60% da velocidade, tom mais baixo junto)
ffmpeg -v error -y -i $M/grito-150.ogg -af "asetrate=44100*0.6,aresample=44100,afade=t=out:st=1.4:d=0.4,volume=1.4" $M/mewtwo-grave.wav
# zumbido psíquico: grave com vibrato
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.35*(sin(2*PI*(95+6*sin(2*PI*7*t))*t)+0.5*sin(2*PI*190*t))*min(1\,t*4):s=44100:d=0.7" -af "afade=t=out:st=0.5:d=0.2" $M/zumbido.wav
# faíscas: estalos (ruído agudo picotado)
ffmpeg -v error -y -f lavfi -i "anoisesrc=color=white:amplitude=0.5:seed=25:duration=0.8" -af "highpass=f=2500,tremolo=f=19:d=1,tremolo=f=7:d=0.9,afade=t=out:st=0.6:d=0.2" $M/faiscas.wav
# "Pika…": o começo do grito do Pikachu
ffmpeg -v error -y -i $M/grito-25.ogg -t 0.55 -af "afade=t=out:st=0.4:d=0.15" $M/pika.wav
# coração acelerando + som subindo (2,1 s, do Pikachu até o último close), corta seco no fim
CORACAO=$(python3 -c '
t, gap, b = 0.0, 0.5, []
while t < 2.0:
    b += [t, t + 0.12]; t += gap; gap = max(0.2, gap * 0.82)
print("+".join(f"0.9*exp(-28*(t-{x:.3f}))*sin(2*PI*55*(t-{x:.3f}))*gte(t\\,{x:.3f})" for x in b))')
ffmpeg -v error -y -f lavfi -i "aevalsrc=$CORACAO:s=44100:d=2.1" $M/coracao.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc=0.28*sin(2*PI*(180*t+430*t*t))*pow(t/2.1\,2):s=44100:d=2.1" $M/subida.wav
ffmpeg -v error -y -i $M/coracao.wav -i $M/subida.wav -filter_complex "amix=inputs=2:normalize=0" $M/tensao.wav
echo SONS
