package com.wesleyledger.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable WebView remote debugging so Chrome DevTools can inspect
        // the app via chrome://inspect/#devices.
        // TODO: Remove or gate this behind BuildConfig.DEBUG before a
        // production release to avoid exposing internals to end users.
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
