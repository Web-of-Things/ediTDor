import React from 'react';
import './App.css';
import TDViewer from './TDViewer/TDViewer'
import WoTLibrary from "./WoTLibrary";

class App extends React.Component {
    WOT = new WoTLibrary();
    adapterBase = "http://localhost:8080"

    constructor(props) {
        super(props)
        this.state = { offlineTD: '', exposedTD: '' }

        this.onChange = this.onChange.bind(this);
        this.lookUpExposedTD = this.lookUpExposedTD.bind(this);
    }

    render() {
        return (
            <div>
                <header>
                    <h1>EdiTDor - The best tool for viewing WoT-TDs</h1>
                </header>
                <main>
                    <div className="tdURL">
                        <input type="url" name="url" id="url"
                            placeholder="https://example.com"
                            pattern="https://.*" size="50"
                            onKeyPress={(event) => this.runScript(event)}
                            required
                        />
                    </div>
                    <div style={{ height: "10px" }}></div>
                    <input type="file" name="file_input" id="file_input" onChange={this.onChange}></input>
                    <div style={{ height: "10px" }}></div>
                    {this.state.exposedTD && <TDViewer td={this.state.exposedTD} wot={this.WOT} />}
                </main>
                <footer>
                    <p>A tool for viewing and editing your great ThingDescription</p>
                </footer>
            </div >
        );
    }

    onChange(e) {
        let app = this;

        var reader = new FileReader();
        reader.readAsText(new Blob([e.target.files[0]], {
            "type": "application/json"
        }));

        reader.onload = function (event) {
            try {
                let td = JSON.parse(event.target.result);
                if (app.validateTD(td)) {
                    app.setState({ offlineTD: td })

                    app.lookUpExposedTD();
                    // app.WOT.consumeTD(td);
                }
            } catch (e) {
                alert('Sorry we were not able to load the TD. Seems like it was no valid JSON object.');
                console.log(e);
            }
        }
    }

    lookUpExposedTD() {
        let app = this;
        let url = app.adapterBase.concat("/.things");

        fetch(url).then(async (json) => {
            let dotThings = await json.json();
            let wasFound = false;

            for (let i = 0; i < dotThings.links.length; i++) {
                const e = dotThings.links[i];
                if (e.title !== app.state.offlineTD.title) {
                    continue;
                }

                wasFound = true;
                let tdURL = new URL(url.toString());
                tdURL.href = tdURL.href.concat(e.href.replace("/.things", ""));

                await app.loadTDFromURL(tdURL);
                break;
            }

            if (!wasFound) {
                app.setState({ exposedTD: "" });
                app.WOT.td = "";

                alert(`An exposed TD with title '${app.state.offlineTD.title}' was not found under '${url}'`);
            }
        }, (res) => {
            console.log(res);
        });
    }

    runScript(e) {
        //Pressing "Enter" Key will start this function
        if (e.keyCode === 13 || e.which === 13) {
            let url = e.target.value;
            if (this.validateURL(url)) {
                this.loadTDFromURL(url)
            }
        }
    }

    validateURL(url) {
        const regex = "((([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[-;:&=\\+\\$,\\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=\\+\\$,\\w]+@)[A-Za-z0-9.-]+)((?:\\/[\\+~%\\/.\\w-_]*)?\\??(?:[-\\+=&;%@.\\w_]*)#?(?:[\\w]*))?)";
        const resultArray = url.match(regex);
        if (!resultArray) {
            alert('Please enter a valid URL.');
            return false
        }
        if (resultArray.join(',') === '') {
            alert('Please enter a valid URL.');
            //TODO: Show Usererror --> Entered URL not valid.
            return false;
        }
        return true;
    }

    async loadTDFromURL(url) {
        try {
            let res = await fetch(url);
            let td = await res.json()
            if (this.validateTD(td)) {
                this.setState({ exposedTD: td })
                this.WOT.consumeTD(td);
            } else {
                //TODO: check if it is a list
                //Else: Show error.
            }
        } catch (e) {
            alert('Sorry we were not able to load the TD. Please check the URL.')
            console.log(e);
            //TODO: Show Usererror --> unable to load TD
        }

    }


    validateTD(td) {
        //https://www.w3.org/TR/wot-scripting-api/#validating-a-thing-description
        return true;
    }
}

export default App;
