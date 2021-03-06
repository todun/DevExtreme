import $ from "jquery";

import "ui/html_editor";
import fx from "animation/fx";

const TOOLBAR_CLASS = "dx-htmleditor-toolbar";
const TOOLBAR_WRAPPER_CLASS = "dx-htmleditor-toolbar-wrapper";
const TOOLBAR_FORMAT_WIDGET_CLASS = "dx-htmleditor-toolbar-format";
const DROPDOWNMENU_CLASS = "dx-dropdownmenu-button";
const BUTTON_CONTENT_CLASS = "dx-button-content";
const QUILL_CONTAINER_CLASS = "dx-quill-container";
const STATE_DISABLED_CLASS = "dx-state-disabled";
const HEX_FIELD_CLASS = "dx-colorview-label-hex";
const INPUT_CLASS = "dx-texteditor-input";
const DIALOG_CLASS = "dx-formdialog";
const DIALOG_FORM_CLASS = "dx-formdialog-form";
const BUTTON_CLASS = "dx-button";

const { test } = QUnit;

QUnit.module("Toolbar integration", {
    beforeEach: () => {
        this.clock = sinon.useFakeTimers();
        fx.off = true;
    },
    afterEach: () => {
        this.clock.restore();
        fx.off = false;
    }
}, () => {
    test("Apply simple format without focus", (assert) => {
        $("#htmlEditor").dxHtmlEditor({
            value: "<p>test</p>",
            toolbar: { items: ["bold"] }
        });

        try {
            $("#htmlEditor")
                .find(`.${TOOLBAR_FORMAT_WIDGET_CLASS}`)
                .trigger("dxclick");
        } catch(e) {
            assert.ok(false, "error on formatting");
        }

        assert.ok(true);
    });

    test("Apply simple format with selection", (assert) => {
        const done = assert.async();
        const expected = "<strong>te</strong>st";
        const instance = $("#htmlEditor").dxHtmlEditor({
            value: "<p>test</p>",
            toolbar: { items: ["bold"] },
            onValueChanged: (e) => {
                assert.equal(e.value, expected, "markup contains an image");
                done();
            }
        })
            .dxHtmlEditor("instance");

        instance.setSelection(0, 2);
        $("#htmlEditor")
            .find(`.${TOOLBAR_FORMAT_WIDGET_CLASS}`)
            .trigger("dxclick");
    });

    test("Apply format via color dialog located in the adaptive menu", (assert) => {
        const done = assert.async();
        const toolbarClickStub = sinon.stub();
        const expected = '<span style="color: rgb(250, 250, 250);">te</span>st';
        const instance = $("#htmlEditor").dxHtmlEditor({
            value: "<p>test</p>",
            toolbar: { items: [{ formatName: "color", locateInMenu: "always" }] },
            onValueChanged: (e) => {
                assert.equal(e.value, expected, "color has been applied");
                assert.equal(toolbarClickStub.callCount, 2, "Clicks on toolbar buttons should bubbling to the toolbar container");
                done();
            }
        }).dxHtmlEditor("instance");

        instance.setSelection(0, 2);

        $(`.${TOOLBAR_CLASS}`).on("dxclick", toolbarClickStub);
        $("#htmlEditor")
            .find(`.dx-dropdownmenu-button`)
            .trigger("dxclick");

        $(`.${TOOLBAR_FORMAT_WIDGET_CLASS}`)
            .trigger("dxclick");

        $(`.${HEX_FIELD_CLASS} .${INPUT_CLASS}`)
            .val("fafafa")
            .change();


        $(`.${DIALOG_CLASS} .${BUTTON_CLASS}`)
            .first()
            .trigger("dxclick");
    });

    test("Add a link via dialog", (assert) => {
        const done = assert.async();
        const expected = '<a href="http://test.com" target="_blank">te</a>st';
        const instance = $("#htmlEditor").dxHtmlEditor({
            value: "<p>test</p>",
            toolbar: { items: ["link"] },
            onValueChanged: (e) => {
                assert.equal(e.value, expected, "link has been added");
                done();
            }
        }).dxHtmlEditor("instance");

        instance.setSelection(0, 2);
        $("#htmlEditor")
            .find(`.${TOOLBAR_FORMAT_WIDGET_CLASS}`)
            .trigger("dxclick");

        const $inputs = $(`.${DIALOG_FORM_CLASS} .${INPUT_CLASS}`);
        const linkText = $inputs
            .last()
            .val();

        assert.strictEqual(linkText, "te", "Link test equal to the selected content");

        $inputs
            .first()
            .val("http://test.com")
            .change();

        $(`.${DIALOG_CLASS} .${BUTTON_CLASS}`)
            .first()
            .trigger("dxclick");
    });

    test("Overflow menu button should have a correct content", (assert) => {
        $("#htmlEditor").html("<p>test</p>").dxHtmlEditor({
            toolbar: { items: ["bold", { text: "test", showInMenu: "always" }] }
        });

        const buttonContent = $("#htmlEditor")
            .find(`.${DROPDOWNMENU_CLASS} .${BUTTON_CONTENT_CLASS}`)
            .html();
        const expectedContent = '<i class="dx-icon dx-icon-overflow"></i>';

        assert.equal(buttonContent, expectedContent);
    });

    test("Editor disposing should dispose external toolbar", (assert) => {
        const $toolbarContainer = $("<div>").addClass("external-container");
        $("#qunit-fixture").append($toolbarContainer);

        const editor = $("#htmlEditor").dxHtmlEditor({
            toolbar: {
                container: $toolbarContainer,
                items: ["bold"]
            }
        }).dxHtmlEditor("instance");

        assert.ok($toolbarContainer.hasClass(TOOLBAR_WRAPPER_CLASS), "Container has wrapper class");
        assert.equal($toolbarContainer.find(`.${TOOLBAR_CLASS}`).length, 1, "Toolbar container contains the htmlEditor's toolbar");

        editor.dispose();

        assert.equal($toolbarContainer.html(), "", "Container's inner html is empty");
        assert.notOk($toolbarContainer.hasClass(TOOLBAR_WRAPPER_CLASS), "Container hasn't wrapper class");
    });

    test("Editor should consider toolbar height", (assert => {
        const height = 100;
        let markup = "";

        for(let i = 1; i < 50; i++) {
            markup += `<p>test ${i}</p>`;
        }

        $("#htmlEditor").html(markup).dxHtmlEditor({
            height: height,
            toolbar: { items: ["bold"] }
        });

        const quillContainerHeight = $(`#htmlEditor .${QUILL_CONTAINER_CLASS}`).outerHeight();
        const toolbarHeight = $(`#htmlEditor .${TOOLBAR_WRAPPER_CLASS}`).outerHeight();

        assert.roughEqual(quillContainerHeight + toolbarHeight, height, 1, "Toolbar + editor equals to the predefined height");
    }));

    test("Toolbar correctly disposed after repaint", (assert) => {
        const $toolbarContainer = $("<div>").addClass("external-container");
        $("#qunit-fixture").append($toolbarContainer);

        const editor = $("#htmlEditor").dxHtmlEditor({
            toolbar: {
                container: $toolbarContainer,
                items: ["bold"]
            }
        }).dxHtmlEditor("instance");

        editor.repaint();

        assert.ok($toolbarContainer.hasClass(TOOLBAR_WRAPPER_CLASS), "Container has wrapper class");
        assert.equal($toolbarContainer.find(`.${TOOLBAR_CLASS}`).length, 1, "Toolbar container contains the htmlEditor's toolbar");
    });

    test("Toolbar should be disabled once editor is read only", (assert) => {
        $("#htmlEditor").dxHtmlEditor({
            readOnly: true,
            toolbar: { items: ["bold"] }
        });

        const isToolbarDisabled = $(`.${TOOLBAR_CLASS}`).hasClass(STATE_DISABLED_CLASS);
        assert.ok(isToolbarDisabled);
    });

    test("Toolbar should be disabled once editor is disabled", (assert) => {
        $("#htmlEditor").dxHtmlEditor({
            disabled: true,
            toolbar: { items: ["bold"] }
        });

        const isToolbarDisabled = $(`.${TOOLBAR_CLASS}`).hasClass(STATE_DISABLED_CLASS);
        assert.ok(isToolbarDisabled);
    });

    test("Toolbar should correctly update disabled state on the option changed", (assert) => {
        const editor = $("#htmlEditor").dxHtmlEditor({
            disabled: true,
            readOnly: true,
            toolbar: { items: ["bold"] }
        }).dxHtmlEditor("instance");
        const $toolbar = $(`.${TOOLBAR_CLASS}`);

        editor.option("disabled", false);
        assert.ok($toolbar.hasClass(STATE_DISABLED_CLASS));

        editor.option("readOnly", false);
        assert.notOk($toolbar.hasClass(STATE_DISABLED_CLASS));

        editor.option("disabled", true);
        assert.ok($toolbar.hasClass(STATE_DISABLED_CLASS));
    });
});
