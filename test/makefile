run:
	live-server

download:
	wget https://klattmose.github.io/CookieClicker/Download/Versions/2.029.7z
	7z x 2.029.7z
	sed 's|<head>|<head><script src="test-utils.js"></script>|' -i index.html
	sed 's/showAds=true;/showAds=false;/' -i showads.js

clean:
	rm 2.029.7z base64.js cookieconsent.css cookieconsent.js css.css index.html main.js minigameGarden.js minigameGrimoire.js minigameMarket.js minigamePantheon.js showads.js style.css
	rm -r img/ snd/
