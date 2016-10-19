(body: PostBody, attachments: Binary[]): Promise<MessageInfo> {
        function inNode(): boolean {
            return typeof process != "undefined" && !process["browser"];
        }

        function browserSupportBlob(): boolean {
            return typeof Blob == "function";
        }
        let meta = JSON.stringify(body);
        let form = new FormData();
        const jsonType = "application/json";
        if (inNode()) {
            form.append("json", meta, { filename: 'request.json', contentType: jsonType });
            for (let i = 0; i < attachments.length; i++) {
                let atch = attachments[i];
                if (typeof atch == "string") {
                    form.append("attachment", atch, { contentType: "text/plain" });
                } else {
                    form.append("attachment", atch);
                }
            }
        } else if (browserSupportBlob()) {
            form.append("json", new Blob([meta], { type: jsonType }));
            for (let i = 0; i < attachments.length; i++) {
                let atch = attachments[i];
                if (typeof atch == "string") {
                    form.append("attachment", new Blob([atch], { type: "text/plain" }));
                } else {
                    form.append("attachment", atch);
                }
            }
        } else {
            return Promise.reject("Your're not in node and your environment does not support Blob or File API.");
        }

        return this.getService().post(this.getEndpoint(false), form).then(res => res.json());
    }